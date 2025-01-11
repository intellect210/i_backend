const redisManager = require('./redisManager');
const { ERROR_CODES } = require('../config/constants');

class AgentStateManager {
    constructor(sendMessage) {
        this.states = {
            initializing: 'initializing',
            processingInput: 'processing input',
            updatingPersonalInfo: 'updating personal information',
            waitingForUserInput: 'waiting for user input',
            awaitingBotResponse: 'awaiting response',
            actionInProgress: 'action in progress',
            actionCompleted: 'action completed',
            handlingConflict: 'handling conflict',
            error: 'error',
            errorDuringAction: 'error during action',
            executionPaused: 'execution paused',
            finalizing: 'finalizing execution',
            completed: 'completed',
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

        console.log("setting state:", userId, stateData);

        try {
            await this.enqueueState(userId, stateData);
        } catch (error) {
            console.error("Error setting state:", error);
            throw error;
        }
    }

    /**
     * Enqueues the state data for processing.
     * @param {string} userId - The ID of the user.
     * @param {Object} stateData - The state data to enqueue.
     */
    async enqueueState(userId, stateData) {
        const queueItem = JSON.stringify({ userId, stateData });

        try {
            const success = await redisManager.rPush(this.stateQueueKey, queueItem);
            if (!success) {
                throw new Error('Failed to enqueue state in Redis');
            }
            await this.processQueue();
        } catch (error) {
            console.error("Error enqueuing state:", error);
            throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
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
            throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
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
            throw { code: ERROR_CODES.WEBSOCKET_ERROR, message: `Error broadcasting state to user ${userId}: ${error.message}` };
        }
    }
}

module.exports = AgentStateManager;