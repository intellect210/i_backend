// FILE: utils/agents/agent-state-manager.js
// Updated agent state manager to remove the _process and save function
const redisManager = require('../respositories/redisManager');
const { ERROR_CODES } = require('../../config/config-constants');
const AgentState = require('../../models/agentStateModel');
const Task = require('../../models/taskModel');
const { v4: uuidv4 } = require('uuid');
const taskController = require('../../controllers/controller-task');

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
            scheduleFollowup: 'Scheduling a Followup',

            TasksStates: {
                taskInitializing: 'Initializing Task',
                taskProcessingInput: 'Processing Task Input',
                taskProcessingFailed: 'Task Processing Failed',
                performingAction: 'Performing Actions',
                taskCompleted: 'Task Processing Completed',
                taskError: 'Task Error',

                TaskActions: {
                    fetchEmails: {
                        fetchingEmails: 'Fetching Emails',
                        emailsFetched: 'Emails Fetched',
                        emailsFetchError: 'Error Fetching Emails',
                    },
                    getttingScreenContext: {
                        gettingScreenContext: 'Getting Screen Context',
                        screenContextRetrieved: 'Screen Context Retrieved',
                        screenContextError: 'Error Getting Screen Context',
                    },
                    getNotificationFromUserDevice: {
                        gettingNotification: 'Getting Notification',
                        notificationRetrieved: 'Notification Retrieved',
                        notificationError: 'Error Getting Notification',
                    },
                    getCalendarEvents: {
                        gettingCalendarEvents: 'Getting Calendar Events',
                        calendarEventsRetrieved: 'Calendar Events Retrieved',
                        calendarEventsError: 'Error Getting Calendar Events',
                    },
                    llmPipeline: {
                        executingLLMPipeline: 'Executing LLM Pipeline',
                        llmPipelineExecuted: 'LLM Pipeline Executed',
                        llmPipelineError: 'Error Executing LLM Pipeline',
                    },
                    profileUpdate: {
                        updatingProfile: 'Updating Profile',
                        profileUpdated: 'Profile Updated',
                        profileUpdateError: 'Error Updating Profile',
                    },
                    scheduleReminder: {
                        schedulingReminder: 'Scheduling Reminder',
                        reminderScheduled: 'Reminder Scheduled',
                        reminderScheduleError: 'Error Scheduling Reminder',
                    },
                    noActionOption: {
                        noAction: 'No Action',
                    }
                }
            }
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
      * @param {string|null} taskId - The ID of the task associated with the state.
     */
     async setState(userId, state, messageId, errorMessage = null, taskId = null) {
         const stateData = {
             state: state,
            timestamp: Date.now(),
            errorMessage: errorMessage,
             taskId: taskId
        };
        try {
              await this.enqueueState(userId, stateData, messageId);
        } catch (error) {
            console.log("Error setting state:", error);
          return;
        }
    }
    /**
     * Enqueues the state data for processing.
     * @param {string} userId - The ID of the user.
     * @param {Object} stateData - The state data to enqueue.
     */
     async enqueueState(userId, stateData, messageId) {
          try {
             const processedStateData = await this._processAndSaveState( stateData);
             const queueItem = JSON.stringify({ userId, stateData: processedStateData });
             const success = await redisManager.rPush(this.stateQueueKey, queueItem);
            if (!success) {
                 console.log('Failed to enqueue state in Redis');
                return;
            }
             await this.processQueue();
         } catch (error) {
              console.log("Error enqueuing state:", error);
           }
     }

     async _processAndSaveState(stateData) {
        try {
            let sequence = 1;
             if(stateData.taskId){
                const task = await Task.findOne({ taskId: stateData.taskId }).populate('executionStatus');
               if (task && task.executionStatus && task.executionStatus.length > 0) {
                  sequence = task.executionStatus.length + 1;
                }
            }
 
           const agentState = new AgentState({
                state: stateData.state,
                 timestamp: stateData.timestamp,
                errorMessage: stateData.errorMessage,
                 taskId: stateData.taskId,
                sequence: sequence
               });
             await agentState.save();
            if(stateData.taskId){
               const task = await Task.findOne({taskId: stateData.taskId});
                if(task) {
                 await taskController.addExecutionStatus(stateData.taskId, agentState._id);
                } else {
                   console.log('Task not found for taskId:', stateData.taskId);
                }
             }
            return { ...stateData, sequence: sequence, agentStateId: agentState._id}
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
           return;
         }
     }
}

module.exports = AgentStateManager;