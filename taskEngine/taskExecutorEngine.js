const { TaskActionExecutor } = require('./taskActionExecutor');
const { RedisTmpDataManagerForTasks } = require('./redisTmpDataManagerForTasks');
const { TaskActionDefinitions } = require('./TaskActionDefinitions');

class TaskExecutorEngine {
    constructor() {
        this.taskActionExecutor = new TaskActionExecutor();
        this.redisTmpDataManager = new RedisTmpDataManagerForTasks();
    }

    async executeTask(userId, taskId, plan) {
        console.log(`[TaskExecutorEngine] Executing task ${taskId} for user ${userId}`);
        try {
            const parsedPlan = this._validateAndParsePlan(plan);
            const actions = parsedPlan.actions;
            let overallStatus = {
                success: true,
                message: 'Task execution completed',
                taskData: {}
            };

            // Filter and sort actions based on isIncluded and executionOrderIfIncluded
            const includedActions = Object.entries(actions)
                .filter(([_, action]) => action.isIncluded)
                .sort(([_, actionA], [__, actionB]) => actionA.executionOrderIfIncluded - actionB.executionOrderIfIncluded);

            for (const [actionKey, action] of includedActions) {
                const actionResult = await this._executeAction(taskId, actionKey, action);
                if (actionResult && actionResult.data) {
                    await this.redisTmpDataManager.storeActionData(taskId, actionKey, actionResult.data);
                }

                if (!actionResult.success) {
                    overallStatus.success = false;
                    overallStatus.message = `Task execution failed at action: ${actionKey}`;
                    console.warn(`[TaskExecutorEngine] Partial failure for action: ${actionKey}`);
                    // Here you can decide whether to break or continue with other actions in case of failure
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
            throw new Error('Invalid plan: Plan must be a valid JSON string');
        }

        const parsedPlan = JSON.parse(plan);
        if (!parsedPlan || typeof parsedPlan !== 'object' || !parsedPlan.actions) {
            throw new Error('Invalid plan format: Missing or malformed actions');
        }

        return parsedPlan;
    }

    async _executeAction(taskId, actionKey, action) {
        console.log(`[TaskExecutorEngine] Executing action ${actionKey} for task ${taskId}`);

        if (!action || typeof action !== 'object') {
            console.warn(`[TaskExecutorEngine] Skipping invalid action: ${actionKey}`);
            return { success: false, message: 'Invalid action format' };
        }

        const actionDefinition = TaskActionDefinitions.getAction(actionKey);
        if (!actionDefinition) {
            console.warn(`[TaskExecutorEngine] No definition found for action: ${actionKey}`);
            return { success: false, message: 'Action definition not found' };
        }

        try {
            const actionHandler = this._getActionHandler(actionDefinition.name);
            if (!actionHandler) {
                throw new Error(`Handler not implemented for action: ${actionDefinition.name}`);
            }

             // Call the handler with necessary parameters
            let actionResult;
            switch (actionDefinition.name) {
                case 'fetchEmails':
                    actionResult = await actionHandler(action.isIncluded, action.SearchQueryInDetails, action.executionOrderIfIncluded);
                    break;
                case 'llmPipeline':
                    actionResult = await actionHandler(action.isIncluded, action.systemInstructions, action.executionOrderIfIncluded, action.inputContexts, action.baseQuery);
                    break;
                case 'getScreenContext':
                    actionResult = await actionHandler(action.isIncluded, action.executionOrderIfIncluded);
                    break;
                case 'getNotificationFromUserDevice':
                    actionResult = await actionHandler(action.isIncluded, action.executionOrderIfIncluded, action.filterByApp, action.filterByContent);
                    break;
                case 'getCalendarEvents':
                    actionResult = await actionHandler(action.isIncluded, action.executionOrderIfIncluded, action.timeRange);
                    break;
                case 'noActionOption':
                    actionResult = await actionHandler(action.isIncluded);
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
            noActionOption: this.taskActionExecutor.noActionOption.bind(this.taskActionExecutor)
        };

        return handlerMap[actionName] || null;
    }
}

module.exports = { TaskExecutorEngine };