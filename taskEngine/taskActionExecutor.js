const { v4: uuidv4 } = require('uuid');
const { RedisTmpDataManagerForTasks } = require('./redisTmpDataManagerForTasks');
const { TaskActionDefinitions } = require('./TaskActionDefinitions');
const Personalization = require('../models/personalizationModel');
const SchedulerService = require('../services/schedulerService');
const schedulerService = new SchedulerService();
const notificationService = require('../services/notificationService'); // Import notification service
const redisTmpDataManager = new RedisTmpDataManagerForTasks();

class TaskActionExecutorImpl {
    constructor(sendMessage) {
        this.sendMessage = sendMessage;
    }

    async fetchEmails(taskId, isIncluded, SearchQueryInDetails, executionOrderIfIncluded) {
        console.log(`[TaskActionExecutorImpl] fetchEmails called`);
        if (!isIncluded || Math.random() < 0.3) {
            const data = { isIncluded, SearchQueryInDetails, executionOrderIfIncluded, emails: [] };
            await redisTmpDataManager.storeActionData(taskId, 'fetchEmails', data);
            return { success: true, message: 'fetchEmails action executed, no emails fetched', data };
        }
        const emails = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
            id: uuidv4(),
            sender: `test${Math.floor(Math.random() * 100)}@example.com`,
            subject: `Test Email ${Math.floor(Math.random() * 10)}`,
            body: `This is a test email body ${Math.random()}`,
        }));
        const data = { isIncluded, SearchQueryInDetails, executionOrderIfIncluded, emails }
        await redisTmpDataManager.storeActionData(taskId, 'fetchEmails', data);
        return { success: true, message: 'fetchEmails action executed', data };
    }

    async llmPipeline(taskId, isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery) {
        console.log(`[TaskActionExecutorImpl] llmPipeline called`);
        if (!isIncluded || Math.random() < 0.3) {
            const data = { isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery, output: null };
            await redisTmpDataManager.storeActionData(taskId, 'llmPipeline', data);
            return { success: true, message: 'llmPipeline action executed, no llm output', data };
        }
        const output = `LLM output for query "${baseQuery}" with instructions "${systemInstructions}" ${Math.random()}`;
        const data = { isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery, output }
        await redisTmpDataManager.storeActionData(taskId, 'llmPipeline', data);
        return { success: true, message: 'llmPipeline action executed', data };
    }

    async getScreenContext(taskId, isIncluded, executionOrderIfIncluded) {
        console.log(`[TaskActionExecutorImpl] getScreenContext called`);
        if (!isIncluded || Math.random() < 0.3) {
            const data = { isIncluded, executionOrderIfIncluded, context: null };
            await redisTmpDataManager.storeActionData(taskId, 'getScreenContext', data);
            return { success: true, message: 'getScreenContext action executed, no screen context found', data };
        }
        const context = `Screen context: User is on ${Math.random() > 0.5 ? 'dashboard' : 'settings'} page ${Math.random()}`;
        const data = { isIncluded, executionOrderIfIncluded, context };
        await redisTmpDataManager.storeActionData(taskId, 'getScreenContext', data);
        return { success: true, message: 'getScreenContext action executed', data };
    }

    async getNotificationFromUserDevice(taskId, isIncluded, executionOrderIfIncluded, filterByApp, filterByContent, userId) {
        console.log(`[TaskActionExecutorImpl] getNotificationFromUserDevice called`);

        if (!isIncluded) {
             const data = { isIncluded, executionOrderIfIncluded, filterByApp, filterByContent, notifications: [] };
            await redisTmpDataManager.storeActionData(taskId, 'getNotificationFromUserDevice', data);
            return { success: true, message: 'getNotificationFromUserDevice action skipped, not included', data };
         }

        try {
              const notificationResult = await notificationService.requestNotifications(userId, filterByApp, filterByContent, this.sendMessage);
              const data = { isIncluded, executionOrderIfIncluded, filterByApp, filterByContent, notifications: notificationResult.notifications };

              if(notificationResult.success) {
                  await redisTmpDataManager.storeActionData(taskId, 'getNotificationFromUserDevice', data);
                 return { success: true, message: `getNotificationFromUserDevice action completed`, data };
              }
                 await redisTmpDataManager.storeActionData(taskId, 'getNotificationFromUserDevice', {
                    isIncluded,
                     executionOrderIfIncluded,
                     filterByApp,
                     filterByContent,
                    notifications: [],
                     error: notificationResult.message
                });
            return { success: false, message: `getNotificationFromUserDevice action failed, due to: ${notificationResult.message}`, data };

        } catch (error) {
              await redisTmpDataManager.storeActionData(taskId, 'getNotificationFromUserDevice', {
                   isIncluded,
                    executionOrderIfIncluded,
                    filterByApp,
                    filterByContent,
                   notifications: [],
                    error: error.message
               });
            console.error('Error getting notifications from user device:', error);
             return { success: false, message: `Error getting notifications from user device: ${error.message}` , data: {
                    isIncluded,
                    executionOrderIfIncluded,
                    filterByApp,
                    filterByContent,
                   notifications: [],
                    error: error.message
               }};
        }

    }

    async getCalendarEvents(taskId, isIncluded, executionOrderIfIncluded, timeRange) {
        console.log(`[TaskActionExecutorImpl] getCalendarEvents called`);
        if (!isIncluded || Math.random() < 0.3) {
            const data = { isIncluded, executionOrderIfIncluded, timeRange, events: [] };
            await redisTmpDataManager.storeActionData(taskId, 'getCalendarEvents', data);
            return { success: true, message: 'getCalendarEvents action executed, no events found', data };
        }
        const events = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => ({
            id: uuidv4(),
            title: `Event ${Math.floor(Math.random() * 10)}`,
            start: new Date().toISOString(),
            end: new Date(new Date().getTime() + 3600000).toISOString(), // 1 hour later
        }));
        const data = { isIncluded, executionOrderIfIncluded, timeRange, events };
        await redisTmpDataManager.storeActionData(taskId, 'getCalendarEvents', data);
        return { success: true, message: 'getCalendarEvents action executed', data };
    }

    async noActionOption(taskId, isIncluded) {
        console.log(`[TaskActionExecutorImpl] noActionOption called`);
        const data = { isIncluded };
        await redisTmpDataManager.storeActionData(taskId, 'noActionOption', data);
        return { success: true, message: 'noActionOption action executed', data };
    }

    async profileUpdate(taskId, isIncluded, executionOrderIfIncluded, finalEditedInfo, userId) {
        console.log(`[TaskActionExecutorImpl] profileUpdate called`);
        if (!isIncluded) {
            const data = { isIncluded, executionOrderIfIncluded, final_edited_info_only: null };
            await redisTmpDataManager.storeActionData(taskId, 'profileUpdate', data);
            return { success: true, message: 'profileUpdate action executed, no update needed', data };
        }
        try {
            if (!finalEditedInfo) {
                throw new Error("Invalid payload for personal info update.");
            }

            let personalization = await Personalization.findOne({ useruid: userId });

            if (!personalization) {
                personalization = new Personalization({ useruid: userId, personalInfo: finalEditedInfo });
            } else {
                personalization.personalInfo = finalEditedInfo;
            }

            await personalization.save();

            const data = { isIncluded, executionOrderIfIncluded, final_edited_info_only: personalization.personalInfo };
            await redisTmpDataManager.storeActionData(taskId, 'profileUpdate', data);

            return {
                success: true,
                message: 'Personal info updated successfully',
                data
            };
        } catch (error) {
            console.error('Error updating personal info:', error);
            return {
                success: false,
                message: "Failed to update personal info",
                originalError: error
            };
        }
    }

    async scheduleReminder(taskId, isIncluded, executionOrderIfIncluded, task, userId) {
        console.log(`[TaskActionExecutorImpl] scheduleReminder called`);

        if (!isIncluded) {
            const data = { isIncluded, executionOrderIfIncluded, task: null };
            await redisTmpDataManager.storeActionData(taskId, 'scheduleReminder', data);
            return { success: true, message: 'scheduleReminder action executed, no reminder needed', data };
        }
        try {
            const scheduleResult = await schedulerService.scheduleReminder(userId, JSON.stringify({task}));
            const data = { isIncluded, executionOrderIfIncluded, task, scheduleResult };

            if (scheduleResult.success) {
                await redisTmpDataManager.storeActionData(taskId, 'scheduleReminder', data);
                return {
                    success: true,
                    message: `Reminder scheduled successfully with job ID: ${scheduleResult.reminderId}`,
                    data
                };
            } else {
                return {
                    success: false,
                    message: `Reminder scheduling failed due to: ${scheduleResult.message}.`,
                    data
                };
            }
        } catch (error) {
            console.error('Error scheduling reminder:', error);
            return {
                success: false,
                message: "Failed to schedule reminder.",
                originalError: error
            };
        }
    }
}

class TaskActionExecutor {
    constructor(sendMessage) {
        this.taskActionExecutorImpl = new TaskActionExecutorImpl(sendMessage);
    }

    async fetchEmails(taskId, isIncluded, SearchQueryInDetails, executionOrderIfIncluded) {
        return this.taskActionExecutorImpl.fetchEmails(taskId, isIncluded, SearchQueryInDetails, executionOrderIfIncluded);
    }

    async llmPipeline(taskId, isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery) {
        return this.taskActionExecutorImpl.llmPipeline(taskId, isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery);
    }

    async getScreenContext(taskId, isIncluded, executionOrderIfIncluded) {
        return this.taskActionExecutorImpl.getScreenContext(taskId, isIncluded, executionOrderIfIncluded);
    }

   async getNotificationFromUserDevice(taskId, isIncluded, executionOrderIfIncluded, filterByApp, filterByContent, userId) {
        return this.taskActionExecutorImpl.getNotificationFromUserDevice(taskId, isIncluded, executionOrderIfIncluded, filterByApp, filterByContent, userId);
    }

    async getCalendarEvents(taskId, isIncluded, executionOrderIfIncluded, timeRange) {
        return this.taskActionExecutorImpl.getCalendarEvents(taskId, isIncluded, executionOrderIfIncluded, timeRange);
    }

    async noActionOption(taskId, isIncluded) {
        return this.taskActionExecutorImpl.noActionOption(taskId, isIncluded);
    }

    async profileUpdate(taskId, isIncluded, executionOrderIfIncluded, finalEditedInfo, userId) {
        return this.taskActionExecutorImpl.profileUpdate(taskId, isIncluded, executionOrderIfIncluded, finalEditedInfo, userId);
    }

    async scheduleReminder(taskId, isIncluded, executionOrderIfIncluded, task, userId) {
        return this.taskActionExecutorImpl.scheduleReminder(taskId, isIncluded, executionOrderIfIncluded, task, userId);
    }
}

module.exports = { TaskActionExecutor };