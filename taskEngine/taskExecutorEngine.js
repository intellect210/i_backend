// FILE: taskEngine/taskExecutorEngine.js
const { TaskActionExecutor } = require('./taskActionExecutor');
const { RedisTmpDataManagerForTasks } = require('./redisTmpDataManagerForTasks');
const { TaskActionDefinitions } = require('./TaskActionDefinitions');
const AgentStateManager = require('../utils/agents/agent-state-manager');
const { v4: uuidv4 } = require('uuid');

// Initialize AgentStateManager with sendMessage function (to be set later)
const agentStateManager = new AgentStateManager(() => {}); // Placeholder function for now

class TaskExecutorEngine {
    constructor(sendMessage) {
        this.taskActionExecutor = new TaskActionExecutor();
        this.redisTmpDataManager = new RedisTmpDataManagerForTasks();
        agentStateManager.sendMessage = sendMessage; // Set the sendMessage function for the AgentStateManager
    }

    async executeTask(userId, query, plan, sendAgentStatus) {
        const taskId = uuidv4();
        console.log(`[TaskExecutorEngine] Executing task ${taskId} for user ${userId}`);
        try {
            const parsedPlan = this._validateAndParsePlan(plan.toString());
            const actions = parsedPlan.actions;
            let overallStatus = {
                success: true,
                message: 'Task execution completed',
                taskData: {}
            };

            console.log("[DEBUG: ] task executor" + actions)

            // Filter and sort actions based on isIncluded and executionOrderIfIncluded
            const includedActions = Object.entries(actions)
                .filter(([_, action]) => action.isIncluded)
                .sort(([_, actionA], [__, actionB]) => actionA.executionOrderIfIncluded - actionB.executionOrderIfIncluded);

            for (const [actionKey, action] of includedActions) {
                const actionDefinition = TaskActionDefinitions.getAction(actionKey);

                if (actionKey === 'noActionOption' && action.isIncluded) {
                    console.log('[TaskExecutorEngine] No action needed, skipping to normal bot response.');
                    if (sendAgentStatus) {
                        await this.sendStatusMessage(userId, actionKey, true, 'No action needed.');
                    }
                    continue; // Skip to the next action
                }

                if (!actionDefinition) {
                    console.warn(`[TaskExecutorEngine] Unknown action type: ${actionKey}`);
                    continue; // Skip unknown actions
                }

                if (sendAgentStatus) {
                    await this.sendStatusMessage(userId, actionKey, true, 'Starting action.');
                }
                const actionResult = await this._executeAction(taskId, actionKey, action, userId);
                if (actionResult && actionResult.data) {
                    await this.redisTmpDataManager.storeActionData(taskId, actionKey, actionResult.data);
                }

                if (!actionResult.success) {
                    overallStatus.success = false;
                    overallStatus.message = `Task execution failed at action: ${actionKey}`;
                    console.warn(`[TaskExecutorEngine] Partial failure for action: ${actionKey}`);
                    if (sendAgentStatus) {
                        await this.sendStatusMessage(userId, actionKey, false, `Failed to execute action: ${actionResult.message}`);
                    }
                } else {
                    if (sendAgentStatus) {
                        await this.sendStatusMessage(userId, actionKey, true, 'Action completed successfully.');
                    }
                }
            }

            overallStatus.taskData = await this.redisTmpDataManager.getActionData(taskId);

            console.log(`[TaskExecutorEngine] Task ${taskId} execution finished for user ${userId}`);
            return overallStatus;
        } catch (error) {
            console.error(`[TaskExecutorEngine] Task execution error for ${taskId}: ${error.message}`);
            return { success: false, message: `Task execution failed: ${error.message}` };
        }
    }

    _validateAndParsePlan(plan) {
        if (!plan || typeof plan !== 'string') {
            return { actions: {} };
        }

        const parsedPlan = JSON.parse(plan);
        // if (!parsedPlan || typeof parsedPlan !== 'object' || !parsedPlan.actions) {
        //     throw new Error('Invalid plan format: Missing or malformed actions');
        // }

        return parsedPlan;
    }

    async _executeAction(taskId, actionKey, action, userId) {
        console.log(`[TaskExecutorEngine] Executing action ${actionKey} for task ${taskId}`);
        if (!action || typeof action !== 'object') {
            console.warn(`[TaskExecutorEngine] Skipping invalid action: ${actionKey}`);
            return { success: false, message: 'Invalid action format' };
        }

        try {
            const actionHandler = this._getActionHandler(actionKey);
            if (!actionHandler) {
                throw new Error(`Handler not implemented for action: ${actionKey}`);
            }

            // Call the handler with necessary parameters
            let actionResult;
            switch (actionKey) {
                case 'fetchEmails':
                    actionResult = await actionHandler(taskId, action.isIncluded, action.SearchQueryInDetails, action.executionOrderIfIncluded);
                    break;
                case 'llmPipeline':
                    actionResult = await actionHandler(taskId, action.isIncluded, action.systemInstructions, action.executionOrderIfIncluded, action.inputContexts, action.baseQuery);
                    break;
                case 'getScreenContext':
                    actionResult = await actionHandler(taskId, action.isIncluded, action.executionOrderIfIncluded);
                    break;
                case 'getNotificationFromUserDevice':
                    actionResult = await actionHandler(taskId, action.isIncluded, action.executionOrderIfIncluded, action.filterByApp, action.filterByContent);
                    break;
                case 'getCalendarEvents':
                    actionResult = await actionHandler(taskId, action.isIncluded, action.executionOrderIfIncluded, action.timeRange);
                    break;
                case 'profileUpdate':
                    actionResult = await actionHandler(taskId, action.isIncluded, action.executionOrderIfIncluded, action.finalEditedInfo, userId);
                    break;
                case 'scheduleReminder':
                    actionResult = await actionHandler(taskId, action.isIncluded, action.executionOrderIfIncluded, action.task, userId);
                    break;
                default:
                    console.warn(`[TaskExecutorEngine] Unknown action type: ${actionKey}`);
                    return { success: false, message: `Unknown action type: ${actionKey}` };
            }
            console.log(`[TaskExecutorEngine] Action ${actionKey} completed with status: ${actionResult.success}`);
            return actionResult;
        } catch (error) {
            console.error(`[TaskExecutorEngine] Error executing action ${actionKey}: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    _getActionHandler(actionName) {
        const handlerMap = {
            fetchEmails: this.taskActionExecutor.fetchEmails.bind(this.taskActionExecutor),
            llmPipeline: this.taskActionExecutor.llmPipeline.bind(this.taskActionExecutor),
            getScreenContext: this.taskActionExecutor.getScreenContext.bind(this.taskActionExecutor),
            getNotificationFromUserDevice: this.taskActionExecutor.getNotificationFromUserDevice.bind(this.taskActionExecutor),
            getCalendarEvents: this.taskActionExecutor.getCalendarEvents.bind(this.taskActionExecutor),
            profileUpdate: this.taskActionExecutor.profileUpdate.bind(this.taskActionExecutor),
            scheduleReminder: this.taskActionExecutor.scheduleReminder.bind(this.taskActionExecutor),
        };

        return handlerMap[actionName] || null;
    }

    async sendStatusMessage(userId, actionKey, success, message) {
        const state = success ? 'completed' : 'failed';
        await agentStateManager.setState(userId, `${actionKey}-${state}`, null, message);
    }
}

module.exports = TaskExecutorEngine;