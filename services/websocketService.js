// FILE: services/websocketService.js
// Updated handleMessage function
const {
    MESSAGE_TYPES,
    MESSAGE_ROLES,
  } = require('../config/config-constants');
  const messageService = require('./messageService');
  const redisService = require('./redisService');
  const websocketConnectionManager = require('../utils/respositories/websocketConnectionManager');
  const ChatHistoryManager = require('../utils/respositories/ChatHistoryManager');
  const chatRepository = require('../utils/respositories/chatRepository');
  const systemInstructions = require('../config/config-systemInstructions.js');
  const DataInjector = require('../utils/helpers/data-injector');
  const botController = require('../controllers/controller-bot');
  const PersonalizationService = require('./personalizationService');
  const dateTimeUtils = require('../utils/helpers/data-time-helper');
  const AgentStateManager = require('../utils/agents/agent-state-manager');
  const ActionExecutor = require('../utils/agents/action-executor');
const taskController = require('../controllers/controller-task');
  const notificationService = require('./notificationService');
  const personalizationService = new PersonalizationService();
  const dataInjector = new DataInjector();
  const actionExecutor = new ActionExecutor();
  const classificationService = require('./classificationService');
    const {TaskExecutorEngine} = require('../taskEngine/taskExecutorEngine');
  
  const websocketService = {
  //=====================================================================================================
  
  /**
   * Handles an incoming user message, processes it, and triggers bot responses if needed.
   */
  handleMessage: async (ws, message) => {
      const agentStateManager = new AgentStateManager(websocketService.sendMessage);

      // Receiving a new message
        const user = ws.user;
      const userId = user.useruid;
      let { messageType, message: text, chatId, role, route, dataType } = message;
    let messageId;
    let taskId;
    console.log(`Handling message from user ${userId}:`, message);

    // Handle notification responses
        if (route === 'stMessage' && dataType === 'Notifications') {
            notificationService.handleNotificationResponse(message);
            return;
        }

    // Initialize history or personal edit
    let history = [];
   
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

        const infoText = `SYSTEM GIVEN INFO - , Current Date and time (take this as a fact): ${currentDateTimeIST
          },Model personalised Name: ${personalizationInfo.personalisedName
          }, Follow given Model Behaviour: ${personalizationInfo.modelBehaviour
          }, Personal Info of user to use whenever necessary: ${personalizationInfo.personalInfo
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
           messageId = userMessageResult.chat.messages.slice(-1)[0].messageId.toString();
      }

        const classificationResult = await classificationService.classify(
            text,
            history
        );
       
        if (classificationResult.actions.noActionOption && classificationResult.actions.noActionOption.isIncluded) {
            console.log(
                'No agent action needed. Proceeding with normal bot response.'
            );
             await botController.streamBotResponse(
            { ...message, chatId },
            null,
            history,
            ws,
            websocketService.handleStream,
            websocketService.handleStreamError
        );
        } else {

        try {
         // Create a new task in the database and get taskId
          const task = await taskController.createTask(userId, classificationResult);
          taskId = task.taskId;
          console.log(`[websocketService] Task created with taskId: ${taskId}`);

          // Add task details to the task
            if(messageId) {
              await taskController.addTaskDetails(taskId, messageId, chatId);
             console.log(
              `[websocketService] messageId added with value: ${messageId} , chatId: ${chatId}`
             );
             }

           // Update the message with taskId
          if (messageId) {
              const chat = await chatRepository.findChatById(chatId);
              const message = chat.messages.find(
                (msg) => msg.messageId.toString() === messageId
            );
            if(message){
              message.taskId = taskId;
              await chat.save();
            }
           console.log(`[websocketService] taskId: ${taskId} added in messageId: ${messageId}`);
          }

          await agentStateManager.setState(
              userId,
              agentStateManager.states.TasksStates.taskInitializing,
             messageId,
             null,
             taskId
            );
           const taskExecutorEngine = new TaskExecutorEngine(websocketService.sendMessage);
            const taskExecutionResult = await taskExecutorEngine.executeTask(userId, text,classificationResult, messageId, true, taskId);

            await agentStateManager.setState(
               userId,
               agentStateManager.states.TasksStates.taskCompleted,
              messageId,
               null,
               taskId
            );

            await agentStateManager.setState(
                 userId,
                agentStateManager.states.awaitingBotResponse,
                 messageId,
                 null,
                 taskId
             );
            
           await botController.streamBotResponse(
              { ...message, chatId, message: taskExecutionResult.finalQuery },
             null,
            history,
             ws,
              websocketService.handleStream,
            websocketService.handleStreamError
           );

           await agentStateManager.setState(
               userId,
             agentStateManager.states.completed,
            messageId,
             null,
             taskId
           );

           if (!taskExecutionResult.success) {
             console.error('Task execution failed:', taskExecutionResult.message);
           }
        } catch (error) {
             console.error(
                '[websocketService] Error handling message (Task Execution):',
                error
             );
             websocketService.sendMessage(userId, {
                type: 'error',
              code: error.code,
              message: error.message || "Error during task execution"
            });
         }
        }
    } catch (error) {
      console.error('Error handling message:', error);
      websocketService.sendMessage(userId, {
        type: 'error',
        code: error.code,
        message: error.message,
      });
    }
  },
  
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