// FILE: websocketService.txt
const {
  MESSAGE_TYPES,
  ERROR_CODES,
  MESSAGE_ROLES,
  MODELS,
  DEFAULT_CLASSIFICATION,
} = require('../config/constants');
const messageService = require('./messageService');
const redisService = require('./redisService');
const BotResponseOrchestrator = require('../utils/BotResponseOrchestrator');
const websocketConnectionManager = require('../utils/websocketConnectionManager');
const ChatHistoryManager = require('../utils/data/ChatHistoryManager');
const chatRepository = require('../utils/data/chatRepository');
const { handleRedisError, handleDatabaseError } = require('../utils/errorHandlers');
const redisManager = require('../utils/redisManager');
const { v4: uuidv4 } = require('uuid');
const systemInstructions = require('../utils/systemInstructions');
const DataInjector = require('../utils/data/dataInjector');
const botResponseOrchestrator = new BotResponseOrchestrator();
const botController = require('../controllers/botController');
const PineconeService = require('../services/pineconeService');
const ClassificationService = require('./classificationService');
const PersonalizationService = require('./personalizationService');
const { info } = require('winston');
const dateTimeUtils = require('../utils/dateTimeUtils');
const ClassificationManager = require('../utils/data/classificationManager');
const AgentStateManager = require('../utils/agentStateManager');
const ActionExecutor = require('../utils/actionExecutor');


const pineconeService = new PineconeService();
const personalizationService = new PersonalizationService();
const dataInjector = new DataInjector();
const classificationManager = new ClassificationManager();
const actionExecutor = new ActionExecutor();


const websocketService = {
    
//=====================================================================================================

handleMessage: async (ws, message) => {
  const user = ws.user;
  const userId = user.useruid;
  let { messageType, message: text, chatId, role } = message;
  const agentStateManager = new AgentStateManager(websocketService.sendMessage);

  console.log(`Handling message from user ${userId}:`, message);

  let actionResult;
  let history = [];
  let isPersonalInfoEdit = false;

  try {
      // Set state to initializing
      // await agentStateManager.setState(userId, agentStateManager.states.initializing);

      // Build chat history
      try {
          if (chatId) {
              const chatHistoryManager = new ChatHistoryManager(chatId, chatRepository);
              history = await chatHistoryManager.buildHistory();
          }

          const personalizationInfo = await personalizationService.getPersonalizationInfo(userId);
          const currentDateTimeIST = dateTimeUtils.getCurrentDateTimeIST();

          const infoText = `Personalised Name: ${personalizationInfo.personalisedName}, Follow given Model Behaviour: ${personalizationInfo.modelBehaviour}, Personal Info to use whenever necessary: ${personalizationInfo.personalInfo}, Current Date and time (take this as a fact): ${currentDateTimeIST}`;

          // Inject system instructions and personalization info into history
          history = dataInjector.injectData(
              history,
              systemInstructions.getInstructions('assistantBehaviorPrompt'),
              'Understood. I follow the given model behaviour.'
          );

          history = dataInjector.injectData(
              history,
              infoText,
              'Understood. I will keep these in mind for this conversation.'
          );
      } catch (error) {
          console.log('Error building chat history or injecting data:', error);
          // Default to an empty history if errors occur
      }

      // Set state to processing input
      await agentStateManager.setState(userId, agentStateManager.states.processingInput);

      // Classify the message
      isPersonalInfoEdit = await classificationManager.classifyMessage(text);
      console.log(`Classification result for message: ${text} is ${isPersonalInfoEdit}`);

      // Store the user message and update chatId
      const userMessageResult = await messageService.storeMessage(
          userId,
          text,
          messageType,
          MESSAGE_ROLES.USER,
          chatId
      );

      if (userMessageResult?.chat) {
          chatId = userMessageResult.chat._id.toString();
      }

      if (isPersonalInfoEdit) {
          // Set state to updating personal info
          await agentStateManager.setState(userId, agentStateManager.states.updatingPersonalInfo);

          const personalInfo = await personalizationService.getPersonalizationInfo(userId);
          console.log(`[DEBUG:] Personal info for user ${userId}:`, personalInfo.personalInfo);

          // Function calling for personal info update
          const botResponse = await botController.sendMessageWithInstructionsWithStructure(
              `${personalInfo.personalInfo ? `current personal info is: ${JSON.stringify(personalInfo.personalInfo)}.` : 'no info till now'} + ${`new info is: ` + text}`,
              'personal_info_update_call',
              null,
              MODELS.GEMINI_105_FLASH,
          );

          console.log(`[DEBUG:] Bot response for personal info update:`, botResponse);

          const sanitizedBotResponse = websocketService.sanitizeBotResponse(botResponse);

          // Set state to action in progress
          await agentStateManager.setState(userId, agentStateManager.states.actionInProgress);

          actionResult = await actionExecutor.executeAction('personalInfoUpdate', sanitizedBotResponse, userId);

          if (!actionResult.success) {
              // Set state to handling conflict
              await agentStateManager.setState(userId, agentStateManager.states.handlingConflict);

              const botResponseForConflict = await botController.handleBotResponse(
                  `I detected some conflict in your information, could you provide what information is correct and what is wrong? Original message: ${text}. Previous info: ${JSON.stringify(personalInfo.personalInfo)}`,
                  MODELS.GEMINI_105_FLASH,
                  history
              );

              // await messageService.storeMessage(
              //     userId,
              //     botResponseForConflict,
              //     MESSAGE_TYPES.TEXT,
              //     MESSAGE_ROLES.BOT,
              //     chatId
              // );



              // Set state to awaiting user input
              await agentStateManager.setState(userId, agentStateManager.states.errorDuringAction);
          } else {
              // Set state to action completed
              await agentStateManager.setState(userId, agentStateManager.states.actionCompleted);
          }
      }

      if (role === 'user' && (!isPersonalInfoEdit || (actionResult))) {
          console.log(`Processing message for bot with history:`, history);

          // Check and update bot processing status
          const redisKey = `bot_processing:${userId}:${chatId}`;
          const isBotProcessing = await redisManager.exists(redisKey);

          if (isBotProcessing) {
              console.log(`Bot is already processing a message for ${userId}:${chatId}. Canceling...`);
              await botResponseOrchestrator.cancelResponse(userId, chatId);
              await botResponseOrchestrator.replaceUserMessage(userId, chatId, text);
              await redisManager.set(redisKey, Date.now());
          }

          // Set state to awaiting bot response
          await agentStateManager.setState(userId, agentStateManager.states.awaitingBotResponse);

          // Stream bot response
          await botController.streamBotResponse(
              { ...message, chatId },
              null,
              history,
              ws,
              websocketService.handleStream,
              websocketService.handleStreamError
          );
      }
  } catch (error) {
      console.error('Error handling message:', error);

      // Set state to error

      websocketService.sendMessage(userId, {
          type: 'error',
          code: error.code,
          message: error.message,
        });
  }
},


   sanitizeBotResponse: (botResponse) => {
        try {
          return JSON.parse(botResponse);
        } catch (error) {
          console.error('Error sanitizing bot response:', error);
          return null;
        }
    }
    
    ,


//=====================================================================================================


  handleNewConnection: async (ws, userId) => {
    console.log('New WebSocket connection established');
    const socketId = ws.id; // Get the socket ID

    console.log(
      `Adding connection for user ${userId} with socket ID ${socketId}`
    );
    websocketConnectionManager.addConnection(userId, ws);

    ws.on('message', async (message) => {
      console.log(`Received message from user ${userId}:`, message);
      try {
        const parsedMessage = JSON.parse(message);
        await websocketService.handleMessage(ws, parsedMessage);
      } catch (error) {
        console.log('Error handling message:', error);
      }
    });

    ws.on('close', () => {
      console.log(
        `WebSocket connection closed for user ${userId} with socket ID ${socketId}`
      );
      websocketService.handleDisconnection(userId, socketId);
    });
  },

  handleStream: async (streamId, chatId, chunk, isStreamEnd, ws) => {
    const userId = ws.user.useruid;

    try {
      if (!isStreamEnd) {
        // Store chunk in Redis with chatId
        await redisService.storeChunk(streamId, chatId, chunk);

        // Send chunk to client
        websocketService.sendMessage(userId, {
          type: MESSAGE_TYPES.CHUNK,
          streamId: streamId,
          chatId: chatId,
          message: chunk,
        });
      } else {
        // End of stream
        // Retrieve and combine chunks from Redis
        const fullMessage = await redisService.combineChunks(streamId, chatId);

        // Store full message in MongoDB using the correct chatId
        const botMessageResult = await messageService.storeMessage(
          userId,
          fullMessage,
          MESSAGE_TYPES.TEXT,
          MESSAGE_ROLES.BOT,
          chatId // Use the chatId passed to the function
        );

        // Send end of stream message to client
        websocketService.sendMessage(userId, {
          type: MESSAGE_TYPES.CHUNK_END,
          streamId: streamId,
          chatId: chatId,
        });

        // Remove chunks from Redis
        await redisService.deleteChunks(streamId, chatId);
      }
    } catch (error) {
      console.log('Error handling stream:', error);
      let errorCode = 'STREAM_ERROR';

      if (error.code) {
        errorCode = error.code;
      } else if (error.name) {
        errorCode = error.name;
      }
      websocketService.sendMessage(userId, {
        type: MESSAGE_TYPES.ERROR,
        streamId,
        chatId,
        code: errorCode,
        message: error.message || 'An error occurred during streaming.',
      });
    }
  },

  handleStreamError: async (streamId, chatId, errorCode, errorMessage, ws) => {
    const userId = ws.user.useruid;
    console.log(
      `Error in stream ${streamId} for chat ${chatId}: ${errorCode} - ${errorMessage}`
    );

    // Send error message to client
    websocketService.sendMessage(userId, {
      type: MESSAGE_TYPES.ERROR,
      streamId,
      chatId,
      code: errorCode,
      message: errorMessage || 'An error occurred during streaming.',
    });

    // Potentially clean up any partial data in Redis related to the streamId and chatId.
    try {
      await redisService.deleteChunks(streamId, chatId);
    } catch (cleanupError) {
      console.log(
        `Error cleaning up Redis chunks for stream ${streamId} and chat ${chatId}:`,
        cleanupError
      );
    }
  },

  handleDisconnection: async (userId, socketId) => {
    console.log(
      `Handling disconnection for user ${userId} with socket ID ${socketId}`
    );
    websocketConnectionManager.removeConnection(userId, socketId);
    await redisService.removeUserSession(userId);
    console.log(`Removed user session from Redis for user ${userId}`);
  },

  sendMessage: async (userId, message) => {
    // console.log(`Sending message to user ${userId}:`, message);
    const userConnections = websocketConnectionManager.getConnection(userId);

    if (userConnections) {
      for (const [socketId, ws] of userConnections.entries()) {
        try {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(message));
            // console.log(
            //   `Message sent to user ${userId} on socket ${socketId}:`,
            //   message
            // );
          } else {
            console.warn(
              `WebSocket for user ${userId} on socket ${socketId} is not in OPEN state. Storing message in Redis.`
            );
            redisService.storeUnsentMessage(userId, message);
          }
        } catch (error) {
          console.log(
            `Error sending message to user ${userId} on socket ${socketId}:`,
            error
          );
          redisService.storeUnsentMessage(userId, message);
        }
      }
    } else {
      console.warn(`User ${userId} is not connected, storing message in Redis`);
      redisService.storeUnsentMessage(userId, message);
    }
  },
}

;

module.exports = websocketService;