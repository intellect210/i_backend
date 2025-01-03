// FILE: utils/agentStateManager.txt
const redisManager = require('./redisManager');
const { ERROR_CODES } = require('../config/constants');

class AgentStateManager {
    constructor(sendMessage) {
      this.states = {
        initializing: 'initializing',
        processingInput: 'processing input',
        updatingPersonalInfo: 'updating personal information',
        waitingForUserInput: 'waiting for user input',
        awaitingBotResponse: 'awaiting bot response',
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

    async setState(userId, state, errorMessage = null) {
         const stateData = {
            state: state,
            timestamp: Date.now(),
             errorMessage: errorMessage,
         };

      try{
         await this.enqueueState(userId,stateData);
        } catch(error){
             console.error("Error setting state:", error);
              throw error;
        }
    }


  async enqueueState(userId, stateData) {
      const queueItem = JSON.stringify({ userId, stateData });

      try {
            const success = await redisManager.rPush(this.stateQueueKey, queueItem);
            if (!success) {
              throw new Error('Failed to enqueue state in Redis');
           }
           // console.log(`Enqueued state for user ${userId} with state: ${JSON.stringify(stateData)} in redis queue`);
         await this.processQueue();
         }
        catch(error){
          console.error("Error enqueuing state:", error);
          throw {code: ERROR_CODES.REDIS_ERROR, message: error.message};
       }
  }

   async processQueue() {
      try {
        // console.log(`checking queue for ${this.stateQueueKey}`);
          const queueItem = await redisManager.lPop(this.stateQueueKey);
         if(queueItem){
            const { userId, stateData } = JSON.parse(queueItem);
              // console.log(`processing queue item ${JSON.stringify({userId, stateData})}`);
             await this.broadcastState(userId, stateData);
         }
          }
        catch(error){
         console.error("Error process queue:", error);
           throw {code: ERROR_CODES.REDIS_ERROR, message: error.message};
       }
   }


    async broadcastState(userId, stateData) {
      try {
        await this.sendMessage(userId, { type: 'agentState', ...stateData });
        // console.log(`Broadcasted state for user ${userId}:`, stateData);
         } catch (error) {
              console.error(`Error broadcasting state for user ${userId}:`, error);
             throw { code: ERROR_CODES.WEBSOCKET_ERROR, message: `Error broadcasting state to user ${userId}: ${error.message}` };
          }
    }
}

module.exports = AgentStateManager;