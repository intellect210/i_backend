// FILE: taskEngine/taskExecutorEngine.js
const { TaskActionExecutor } = require('./taskActionExecutor');
const { RedisTmpDataManagerForTasks } = require('./redisTmpDataManagerForTasks');
const { TaskActionDefinitions } = require('./TaskActionDefinitions');
const { v4: uuidv4 } = require('uuid');

class TaskExecutorEngine {
    constructor() {
        this.taskActionExecutor = new TaskActionExecutor();
        this.redisTmpDataManager = new RedisTmpDataManagerForTasks();
    }

   async executeTask(userId, query, plan) {
    const taskId = uuidv4();
    console.log(`[TaskExecutorEngine] Executing task ${taskId} for user ${userId}`);
    let fallbackToNormal = false;
    let overallStatus = {
            success: true,
            message: 'Task execution completed',
            taskData: {}
    };

    // 1. Early Plan Validation
    const parsedPlan = this._validateAndParsePlan(plan);
    if (!parsedPlan) {
        fallbackToNormal = true;
        return {
            success: false,
            message: 'Invalid plan format, falling back to normal response.',
            overallStatus
        }; // Early return
    }

    const actions = parsedPlan.actions;

    // Filter and sort actions based on isIncluded and executionOrderIfIncluded
    const includedActions = Object.entries(actions)
        .filter(([_, action]) => action.isIncluded)
        .sort(([_, actionA], [__, actionB]) => actionA.executionOrderIfIncluded - actionB.executionOrderIfIncluded);

    for (const [actionKey, action] of includedActions) {
        const actionDefinition = TaskActionDefinitions.getAction(actionKey);

        // 2. Direct Fallback for noActionOption
        if (actionKey === 'noActionOption' && action.isIncluded) {
            console.log('[TaskExecutorEngine] No action needed, immediate fallback to normal bot response.');
            fallbackToNormal = true;
            break; // Immediate break for noActionOption
        }

        if (!actionDefinition) {
            console.warn(`[TaskExecutorEngine] Unknown action type: ${actionKey}`);
            continue; // Skip unknown actions
        }
        
        try {
            const actionResult = await this._executeAction(taskId, actionKey, action, userId);
            if (actionResult && actionResult.data) {
                await this.redisTmpDataManager.storeActionData(taskId, actionKey, actionResult.data);
            }

            if (!actionResult.success) {
                overallStatus.success = false;
                overallStatus.message = `Task execution failed at action: ${actionKey}`;
                console.warn(`[TaskExecutorEngine] Partial failure for action: ${actionKey}`);
                // Continue to the next action even if the current one fails
            }
        } catch (error) {
            console.error(`[TaskExecutorEngine] Error executing action ${actionKey}: ${error.message}`);
            // Continue to the next action even if the current one fails
                overallStatus.success = false;
                overallStatus.message = `Task execution failed at action: ${actionKey}`;
        }
    }


        if (fallbackToNormal) {
            console.log('[TaskExecutorEngine] Fallback to normal bot response.');
             // Trigger normal bot response logic here (e.g., call a function in websocketService)
            // Example:
            // await websocketService.handleNormalBotResponse(userId, query);
            overallStatus = {
                success: true,
                message: "No agent action taken, performing normal response.",
                taskData: {}
           }
        } else {
             overallStatus.taskData = await this.redisTmpDataManager.getActionData(taskId);
        }


    console.log(`[TaskExecutorEngine] Task ${taskId} execution finished for user ${userId}`);
    return {
        ...overallStatus,
       };
}

    _validateAndParsePlan(plan) {
        try {
            return plan;
        } catch (error) {
            console.error("[TaskExecutorEngine] Plan parsing error:", error);
            return null; // Return null for parsing errors
        }
    }


   async _executeAction(taskId, actionKey, action, userId) {
        console.log(`[TaskExecutorEngine] Executing action ${actionKey} for task ${taskId}`);
        console.log('[DEBUG] Action:', action);
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
                    actionResult = await actionHandler(taskId, action.isIncluded, action.executionOrderIfIncluded, action, userId);
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
}

module.exports = TaskExecutorEngine;