// FILE: taskEngine/taskActionExecutor.js
// CHANGES: (No changes required here as they are dummy implementations,
// but ensure taskId is used when calling storeActionData in your actual implementations)

const { v4: uuidv4 } = require('uuid');
const { RedisTmpDataManagerForTasks } = require('./redisTmpDataManagerForTasks');
const { TaskActionDefinitions } = require('./TaskActionDefinitions');

const redisTmpDataManager = new RedisTmpDataManagerForTasks();

class TaskActionExecutorImpl {
    async fetchEmails(isIncluded, SearchQueryInDetails, executionOrderIfIncluded) {
        console.log(`[TaskActionExecutorImpl] fetchEmails called`);
        if (!isIncluded || Math.random() < 0.3) {
             const data = { isIncluded, SearchQueryInDetails, executionOrderIfIncluded, emails: [] };
            //  await redisTmpDataManager.storeActionData('tempId', 'fetchEmails', data);
            return { success: true, message: 'fetchEmails action executed, no emails fetched', data };
        }
        const emails = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
            id: uuidv4(),
            sender: `test${Math.floor(Math.random() * 100)}@example.com`,
            subject: `Test Email ${Math.floor(Math.random() * 10)}`,
            body: `This is a test email body ${Math.random()}`,
        }));
        const data = { isIncluded, SearchQueryInDetails, executionOrderIfIncluded, emails }
          await redisTmpDataManager.storeActionData('tempId', 'fetchEmails', data);
        return { success: true, message: 'fetchEmails action executed', data };
    }

    async llmPipeline(isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery) {
        console.log(`[TaskActionExecutorImpl] llmPipeline called`);
        if (!isIncluded || Math.random() < 0.3) {
             const data = { isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery, output: null };
             await redisTmpDataManager.storeActionData('tempId', 'llmPipeline', data);
            return { success: true, message: 'llmPipeline action executed, no llm output', data };
        }
        const output = `LLM output for query "${baseQuery}" with instructions "${systemInstructions}" ${Math.random()}`;
       const data =  { isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery, output }
      await redisTmpDataManager.storeActionData('tempId', 'llmPipeline', data);
        return { success: true, message: 'llmPipeline action executed', data };
    }

    async getScreenContext(isIncluded, executionOrderIfIncluded) {
        console.log(`[TaskActionExecutorImpl] getScreenContext called`);
       if (!isIncluded || Math.random() < 0.3) {
             const data = { isIncluded, executionOrderIfIncluded, context: null };
             await redisTmpDataManager.storeActionData('tempId', 'getScreenContext', data);
            return { success: true, message: 'getScreenContext action executed, no screen context found', data };
        }
        const context = `Screen context: User is on ${Math.random() > 0.5 ? 'dashboard' : 'settings'} page ${Math.random()}`;
         const data = { isIncluded, executionOrderIfIncluded, context };
         await redisTmpDataManager.storeActionData('tempId', 'getScreenContext', data);
        return { success: true, message: 'getScreenContext action executed', data };
    }

    async getNotificationFromUserDevice(isIncluded, executionOrderIfIncluded, filterByApp, filterByContent) {
        console.log(`[TaskActionExecutorImpl] getNotificationFromUserDevice called`);
           if (!isIncluded || Math.random() < 0.3) {
              const data =  { isIncluded, executionOrderIfIncluded, filterByApp, filterByContent, notifications: [] };
             await redisTmpDataManager.storeActionData('tempId', 'getNotificationFromUserDevice', data);
             return { success: true, message: 'getNotificationFromUserDevice action executed, no notification found', data };
        }
         const notifications = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
            id: uuidv4(),
            app: filterByApp || `app${Math.floor(Math.random() * 10)}`,
            content: filterByContent || `Notification content ${Math.random()}`,
            timestamp: new Date().toISOString(),
        }));
       const data =  { isIncluded, executionOrderIfIncluded, filterByApp, filterByContent, notifications };
     await redisTmpDataManager.storeActionData('tempId', 'getNotificationFromUserDevice', data);
        return { success: true, message: 'getNotificationFromUserDevice action executed', data };
    }

    async getCalendarEvents(isIncluded, executionOrderIfIncluded, timeRange) {
        console.log(`[TaskActionExecutorImpl] getCalendarEvents called`);
         if (!isIncluded || Math.random() < 0.3) {
            const data = { isIncluded, executionOrderIfIncluded, timeRange, events: [] };
            await redisTmpDataManager.storeActionData('tempId', 'getCalendarEvents', data);
            return { success: true, message: 'getCalendarEvents action executed, no events found', data };
        }
        const events = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => ({
            id: uuidv4(),
            title: `Event ${Math.floor(Math.random() * 10)}`,
            start: new Date().toISOString(),
            end: new Date(new Date().getTime() + 3600000).toISOString(), // 1 hour later
        }));
         const data = { isIncluded, executionOrderIfIncluded, timeRange, events };
         await redisTmpDataManager.storeActionData('tempId', 'getCalendarEvents', data);
        return { success: true, message: 'getCalendarEvents action executed', data };
    }

    async noActionOption(isIncluded) {
        console.log(`[TaskActionExecutorImpl] noActionOption called`);
         const data = { isIncluded };
         await redisTmpDataManager.storeActionData('tempId', 'noActionOption', data);
        return { success: true, message: 'noActionOption action executed', data };
    }
}

class TaskActionExecutor {
    constructor() {
        this.taskActionExecutorImpl = new TaskActionExecutorImpl();
    }

    async fetchEmails(isIncluded, SearchQueryInDetails, executionOrderIfIncluded) {
        return this.taskActionExecutorImpl.fetchEmails(isIncluded, SearchQueryInDetails, executionOrderIfIncluded);
    }

    async llmPipeline(isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery) {
        return this.taskActionExecutorImpl.llmPipeline(isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery);
    }

    async getScreenContext(isIncluded, executionOrderIfIncluded) {
        return this.taskActionExecutorImpl.getScreenContext(isIncluded, executionOrderIfIncluded);
    }

    async getNotificationFromUserDevice(isIncluded, executionOrderIfIncluded, filterByApp, filterByContent) {
        return this.taskActionExecutorImpl.getNotificationFromUserDevice(isIncluded, executionOrderIfIncluded, filterByApp, filterByContent);
    }

    async getCalendarEvents(isIncluded, executionOrderIfIncluded, timeRange) {
        return this.taskActionExecutorImpl.getCalendarEvents(isIncluded, executionOrderIfIncluded, timeRange);
    }

    async noActionOption(isIncluded) {
        return this.taskActionExecutorImpl.noActionOption(isIncluded);
    }
}

module.exports = { TaskActionExecutor };