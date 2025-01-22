const {
    MESSAGE_TYPES,
    ERROR_CODES,
    MESSAGE_ROLES,
    MODELS,
    DEFAULT_CLASSIFICATION,
  } = require('../config/config-constants');
  const messageService = require('./messageService');
  const redisService = require('./redisService');
  const BotResponseOrchestrator = require('../utils/BotResponseOrchestrator');
  const websocketConnectionManager = require('../utils/websocketConnectionManager');
  const ChatHistoryManager = require('../utils/data/ChatHistoryManager');
  const chatRepository = require('../utils/data/chatRepository');
  const {
    handleRedisError,
    handleDatabaseError,
  } = require('../utils/errorHandlers');
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
  const actionExecutor = new ActionExecutor();
  const { personalInfoUpdateStructure, remindersStructure } = require('../utils/structureDefinitions');
  const classificationService = require('./classificationService');
  const PreferenceManager = require('../utils/data/preferenceManager');
  const SchedulerService = require('./schedulerService');
  const reminderProcessorService = require('./reminderProcessorService');
  const preferenceManager = new PreferenceManager();
  const schedulerService = new SchedulerService();
  const Reminder = require('../models/reminderModel');
  const logger = require('../utils/logger');
  
  const websocketService = {
  //=====================================================================================================
  
  /**
   * Handles an incoming user message, processes it, and triggers bot responses if needed.
   */
  handleMessage: async (ws, message) => {
      // Receiving a new message
      const user = ws.user;
      const userId = user.useruid;
      let { messageType, message: text, chatId, role } = message;
      const agentStateManager = new AgentStateManager(
          websocketService.sendMessage
      );
      let messageId;
  
      console.log(`Handling message from user ${userId}:`, message);
  
      // Initialize history or personal edit
      let actionResult;
      let history = [];
      let isPersonalInfoEdit = false;
  
      try {
          // Build chat history code piece
  
          try {
              if (chatId) {
                  const chatHistoryManager = new ChatHistoryManager(
                      chatId,
                      chatRepository
                  );
                  history = await chatHistoryManager.buildHistory();
              }
  
              const personalizationInfo =
                  await personalizationService.getPersonalizationInfo(userId);
              const currentDateTimeIST = dateTimeUtils.getCurrentDateTimeIST();
  
              const infoText = `SYSTEM GIVEN INFO - , Current Date and time (take this as a fact): ${currentDateTimeIST}
        ,Model personalised Name: ${
                  personalizationInfo.personalisedName
              }, Follow given Model Behaviour: ${
                  personalizationInfo.modelBehaviour
              }, Personal Info of user to use whenever necessary: ${
                  personalizationInfo.personalInfo
              }`;
  
              // Inject system instructions and personalization info into history
              history = dataInjector.injectData(
                  history,
                  systemInstructions.getInstructions('assistantBehaviorPrompt'),
                  'Understood. I follow the given instructions.'
              );
  
              history = dataInjector.injectData(
                  history,
                  infoText,
                  'Understood. I will keep these in mind for conversations.'
              );
  
          } catch (error) {
              console.log(
                  'Error building chat history or injecting data:',
                  error
              );
              // Default to an empty history if errors occur
          }
  
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
              messageId = userMessageResult.chat.messages.slice(-1)[0].messageId;
          }
  
          // If followupsPreference is false or reminder scheduling fails, proceed with normal message processing
          const classificationResult = await classificationService.classify(
              text,
              history
          );
  
          // Process agent action or proceed with normal bot response
          await websocketService.processAgentAction(
              classificationResult,
              userId,
              chatId,
              history,
              message,
              ws,
              messageId
          );
  
      } catch (error) {
          console.error('Error handling message:', error);
  
          websocketService.sendMessage(userId, {
              type: 'error',
              code: error.code,
              message: error.message,
          });
      }
  },
   //=====================================================================================================
  /**
   * Executes the agent action based on the classification result.
   * @param {Object} classificationResult - The result of the classification, including data for the action.
   * @param {string} userId - The ID of the user.
   * @param {string} chatId - The ID of the chat.
   * @param {Array} history - The chat history.
   * @param {Object} message - The original message object.
   * @param {Object} ws - The WebSocket connection.
   */
    processAgentAction: async (
        classificationResult,
        userId,
        chatId,
        history,
        message,
        ws,
        messageId
    ) => {
        const agentStateManager = new AgentStateManager(
            websocketService.sendMessage
        );
  
        if (classificationResult.payload.classification === 'no_action_needed') {
            console.log(
                'No agent action needed. Proceeding with normal bot response.'
            );
            await agentStateManager.setState(
                userId,
                agentStateManager.states.awaitingBotResponse,
                messageId
            );
            await botController.streamBotResponse(
                { ...message, chatId },
                null,
                history,
                ws,
                websocketService.handleStream,
                websocketService.handleStreamError
            );
            
            await agentStateManager.setState(userId, agentStateManager.states.completed, messageId);
        } else {
             console.log(
                `Agent action needed: ${classificationResult.payload.classification} and actionType is ${classificationResult.payload.classification}`
            );
            try {
                // Set state to action in progress
                await agentStateManager.setState(
                    userId,
                    agentStateManager.states.actionDetected,
                    messageId
                );
                
                let actionResult;
                
                if (classificationResult.payload.classification === 'scheduleReminder') {
                    await agentStateManager.setState(userId, agentStateManager.states.scheduleFollowup, messageId);

                   actionResult = await actionExecutor.executeAction(
                        classificationResult.payload.classification,
                        JSON.stringify(classificationResult.payload.data),
                        userId,
                        messageId
                   )
                 }
                else {
                    await agentStateManager.setState(userId, agentStateManager.states.updatingPersonalInfo, messageId);

                   actionResult = await actionExecutor.executeAction(
                        classificationResult.payload.classification,
                        classificationResult.payload.data,
                        userId,
                        messageId
                  );
                }
  
  
                if (!actionResult.success) {
                    // Set state to error during action
                    await agentStateManager.setState(
                        userId,
                        agentStateManager.states.errorDuringAction,
                        messageId,
                        actionResult.message
                    );
                } else {
                    // Set state to action completed
                    await agentStateManager.setState(
                        userId,
                        agentStateManager.states.actionCompleted,
                        messageId
                    );
                }
  
                // Prepare final context message
                const finalContext = `User query: ${message.message}.
                Agent Status: ${
                    actionResult.success
                        ? actionResult.message || 'Action completed successfully.'
                        : actionResult.message || 'Action failed.'
                }
                (Note: The status reflects the backend execution results based on the user query and is not provided directly by the user.)`;
  
                console.log('final context is ->', finalContext);
  
                // Proceed with normal bot response, including agent status
                await agentStateManager.setState(
                    userId,
                    agentStateManager.states.awaitingBotResponse,
                    messageId
                );
                await botController.streamBotResponse(
                    { ...message, chatId, message: finalContext },
                    null,
                    history,
                    ws,
                    websocketService.handleStream,
                    websocketService.handleStreamError
                );

                await agentStateManager.setState(userId, agentStateManager.states.completed, messageId);
            } catch (error) {
                console.error('Error during agent action execution:', error);
                await agentStateManager.setState(
                    userId,
                    agentStateManager.states.error,
                    messageId,
                    'Error during agent action execution.'
                );
                // Handle error appropriately, possibly by sending an error message to the user
                websocketService.sendMessage(userId, {
                    type: 'error',
                    code: 'AGENT_ACTION_ERROR',
                    message: 'An error occurred during agent action execution.',
                });
            }
        }
    },
    //=====================================================================================================
    /**
     * Manages a newly established WebSocket connection.
     */
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
  
    /**
     * Handles a streaming response by sending chunks to the client and storing them if needed.
     */
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
                const fullMessage = await redisService.combineChunks(
                    streamId,
                    chatId
                );
  
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
  
    /**
     * Manages stream errors and notifies client.
     */
    handleStreamError: async (
        streamId,
        chatId,
        errorCode,
        errorMessage,
        ws
    ) => {
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
  
    /**
     * Performs clean-up when a user disconnects.
     */
    handleDisconnection: async (userId, socketId) => {
        console.log(
            `Handling disconnection for user ${userId} with socket ID ${socketId}`
        );
        websocketConnectionManager.removeConnection(userId, socketId);
        await redisService.removeUserSession(userId);
        console.log(`Removed user session from Redis for user ${userId}`);
    },
  
    /**
     * Sends messages to all active client connections or stores them if no connection is active.
     */
    sendMessage: async (userId, message) => {
        // console.log(`Sending message to user ${userId}:`, message);
        const userConnections =
            websocketConnectionManager.getConnection(userId);
  
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
            console.warn(
                `User ${userId} is not connected, storing message in Redis`
            );
            redisService.storeUnsentMessage(userId, message);
        }
    },
  };
  
  module.exports = websocketService;