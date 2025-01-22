const redisManager = require('./redisManager');
const { ERROR_CODES } = require('../config/config-constants');
const AgentState = require('../models/agentStateModel');
const Chat = require('../models/chatModel');
const { v4: uuidv4 } = require('uuid');

class AgentStateManager {
    constructor(sendMessage) {
        this.states = {
            initializing: 'initializing',
            processingInput: 'processing input',
            updatingPersonalInfo: 'Updating personal information',
            waitingForUserInput: 'waiting for user input',
            actionDetected: 'Action Detected, Performaing Action',
            awaitingBotResponse: 'Awaiting bot response',
            actionInProgress: 'Action in progress',
            actionCompleted: 'Action completed',
            handlingConflict: 'handling conflict',
            error: 'error',
            errorDuringAction: 'error during action',
            executionPaused: 'execution paused',
            finalizing: 'finalizing execution',
            completed: 'completed',
            scheduleFollowup: 'Scheduling a Followup'
        };

        this.stateQueueKey = 'agent_state_queue';
        this.sendMessage = sendMessage;
    }

    /**
     * Sets the state for a user.
     * @param {string} userId - The ID of the user.
     * @param {string} state - The state to set.
     * @param {string} messageId - The ID of the message associated with the state.
     * @param {string|null} errorMessage - An optional error message.
     */
    async setState(userId, state, messageId, errorMessage = null) {
        const stateData = {
            state: state,
            timestamp: Date.now(),
            errorMessage: errorMessage,
            messageId: messageId,
        };

        try {
            await this.enqueueState(userId, stateData);
        } catch (error) {
            console.log("Error setting state:", error);
            // throw error;
            return;
        }
    }

    /**
     * Enqueues the state data for processing.
     * @param {string} userId - The ID of the user.
     * @param {Object} stateData - The state data to enqueue.
     */
    async enqueueState(userId, stateData) {
        try {
            const processedStateData = await this._processAndSaveState(userId, stateData);
            const queueItem = JSON.stringify({ userId, stateData: processedStateData });

             const success = await redisManager.rPush(this.stateQueueKey, queueItem);

            if (!success) {
                // throw new Error('Failed to enqueue state in Redis');
                console.log('Failed to enqueue state in Redis');
                return;
            }
            await this.processQueue();
        } catch (error) {
             console.log("Error enqueuing state:", error);
            //  throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
         }

    }

    async _processAndSaveState(userId, stateData) {
        try {
            const chat = await Chat.findOne({ 'messages.messageId': stateData.messageId }, { 'messages.$': 1 });
            if(!chat) {
                 console.log('Chat not found for messageId:', stateData.messageId);
                 return;
            }

           const message = chat.messages.find(msg => msg.messageId.toString() === stateData.messageId.toString());

           if(!message) {
             console.log('Message not found for messageId:', stateData.messageId);
             return;
           }

            const sequence =  message.agentStates ? message.agentStates.length + 1 : 1;

            const agentState = new AgentState({
                  message: message.messageId,
                  sequence: sequence,
                  state: stateData.state,
                  timestamp: stateData.timestamp,
                  errorMessage: stateData.errorMessage,
                });

              await agentState.save();

              await Chat.updateOne(
                { 'messages.messageId': stateData.messageId },
                { $push: { 'messages.$.agentStates': agentState._id } }
              );

           return { ...stateData, sequence: sequence }
        } catch (error) {
             console.error("Error processing and saving state:", error);
             throw error;
         }
    }

    /**
     * Processes the state queue.
     */
    async processQueue() {
        try {
            const queueItem = await redisManager.lPop(this.stateQueueKey);
            if (queueItem) {
                const { userId, stateData } = JSON.parse(queueItem);
                await this.broadcastState(userId, stateData);
            }
        } catch (error) {
            console.error("Error processing queue:", error);
            // throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
            return;
        }
    }

    /**
     * Broadcasts the state to the user.
     * @param {string} userId - The ID of the user.
     * @param {Object} stateData - The state data to broadcast.
     */
    async broadcastState(userId, stateData) {
        try {
            await this.sendMessage(userId, { type: 'agentState', ...stateData });
        } catch (error) {
            console.error(`Error broadcasting state for user ${userId}:`, error);
            // throw { code: ERROR_CODES.WEBSOCKET_ERROR, message: `Error broadcasting state to user ${userId}: ${error.message}` };
            return;
        }
    }
}

module.exports = AgentStateManager;