const { v4: uuidv4 } = require('uuid');
const { RedisTmpDataManagerForTasks } = require('./redisTmpDataManagerForTasks');
const { TaskActionDefinitions } = require('./TaskActionDefinitions');
const Personalization = require('../models/personalizationModel');
const SchedulerService = require('../services/schedulerService');
const schedulerService = new SchedulerService();
const notificationService = require('../services/notificationService'); // Import notification service
const redisTmpDataManager = new RedisTmpDataManagerForTasks();
const AgentStateManager = require('../utils/agents/agent-state-manager');

class TaskActionExecutorImpl {
    constructor(sendMessage) {
        this.sendMessage = sendMessage;
        this.agentStateManager = new AgentStateManager(sendMessage);
    }

    async _sendStatus(userId, status, taskId, messageId, actionKey, flag_send_status = false, errorMessage = null) {
        if (!flag_send_status) return;

        // Map action keys to human-readable descriptions
        const actionDescriptions = {
            fetchEmails: "Fetching Emails",
            llmPipeline: "Processing with AI",
            getScreenContext: "Retrieving Screen Context",
            getNotificationFromUserDevice: "Fetching Notifications",
            getCalendarEvents: "Fetching Calendar Events",
            noActionOption: "No Action Required",
            profileUpdate: "Updating Profile",
            scheduleReminder: "Scheduling Reminder"
        };

        // Map status to user-friendly messages
        const statusMessages = {
            starting: `Starting ${actionDescriptions[actionKey] || actionKey}...`,
            completed: `${actionDescriptions[actionKey] || actionKey} completed.`,
            error: errorMessage ? `An error occurred: ${errorMessage}` : "An error occurred."
        };

        let message;
        if (status.toLowerCase().includes('starting')) {
            message = statusMessages.starting;
        } else if (status.toLowerCase().includes('completed')) {
            message = errorMessage ? statusMessages.error : statusMessages.completed;
        } else {
            message = status; // Fallback to the original status if no match
        }

        console.log(`[TaskActionExecutorImpl] Sending status: ${message}`);
        await this.agentStateManager.setState(userId, message, messageId, errorMessage, taskId);
    }

    async fetchEmails(taskId, isIncluded, SearchQueryInDetails, executionOrderIfIncluded, userId, messageId, flag_send_status = false) {
        await this._sendStatus(userId, 'Starting', taskId, messageId, 'fetchEmails', flag_send_status);
        console.log(`[TaskActionExecutorImpl] fetchEmails called`);
        if (!isIncluded || Math.random() < 0.3) {
            const data = { isIncluded, SearchQueryInDetails, executionOrderIfIncluded, emails: [] };
            await redisTmpDataManager.storeActionData(taskId, 'fetchEmails', data);
            await this._sendStatus(userId, 'Completed', taskId, messageId, 'fetchEmails', flag_send_status);
            return { success: true, message: 'No emails found', data };
        }
        const emails = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
            id: uuidv4(),
            sender: `test${Math.floor(Math.random() * 100)}@example.com`,
            subject: `Test Email ${Math.floor(Math.random() * 10)}`,
            body: `This is a test email body ${Math.random()}`,
        }));
        const data = { isIncluded, SearchQueryInDetails, executionOrderIfIncluded, emails };
        await redisTmpDataManager.storeActionData(taskId, 'fetchEmails', data);
        await this._sendStatus(userId, 'Completed', taskId, messageId, 'fetchEmails', flag_send_status);
        return { success: true, message: 'Email action executed', data };
    }

    async llmPipeline(taskId, isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery, userId, messageId, flag_send_status = false) {
        await this._sendStatus(userId, 'Starting', taskId, messageId, 'llmPipeline', flag_send_status);
        console.log(`[TaskActionExecutorImpl] llmPipeline called`);
        if (!isIncluded || Math.random() < 0.3) {
            const data = { isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery, output: null };
            await redisTmpDataManager.storeActionData(taskId, 'llmPipeline', data);
            await this._sendStatus(userId, 'Completed', taskId, messageId, 'llmPipeline', flag_send_status);
            return { success: true, message: 'LLM pipeline executed, no output generated', data };
        }
        const output = `LLM output for query "${baseQuery}" with instructions "${systemInstructions}" ${Math.random()}`;
        const data = { isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery, output };
        await redisTmpDataManager.storeActionData(taskId, 'llmPipeline', data);
        await this._sendStatus(userId, 'Completed', taskId, messageId, 'llmPipeline', flag_send_status);
        return { success: true, message: 'LLM pipeline executed', data };
    }

    async getScreenContext(taskId, isIncluded, executionOrderIfIncluded, userId, messageId, flag_send_status = false) {
        await this._sendStatus(userId, 'Starting', taskId, messageId, 'getScreenContext', flag_send_status);
        console.log(`[TaskActionExecutorImpl] getScreenContext called`);
        if (!isIncluded || Math.random() < 0.3) {
            const data = { isIncluded, executionOrderIfIncluded, context: null };
            await redisTmpDataManager.storeActionData(taskId, 'getScreenContext', data);
            await this._sendStatus(userId, 'Completed', taskId, messageId, 'getScreenContext', flag_send_status);
            return { success: true, message: 'No screen context found', data };
        }
        const context = `Screen context: User is on ${Math.random() > 0.5 ? 'dashboard' : 'settings'} page ${Math.random()}`;
        const data = { isIncluded, executionOrderIfIncluded, context };
        await redisTmpDataManager.storeActionData(taskId, 'getScreenContext', data);
        await this._sendStatus(userId, 'Completed', taskId, messageId, 'getScreenContext', flag_send_status);
        return { success: true, message: 'Screen context retrieved', data };
    }

    async getNotificationFromUserDevice(taskId, isIncluded, executionOrderIfIncluded, filterByApp, filterByContent, userId, messageId, flag_send_status = false) {
        await this._sendStatus(userId, 'Starting', taskId, messageId, 'getNotificationFromUserDevice', flag_send_status);
        console.log(`[TaskActionExecutorImpl] getNotificationFromUserDevice called`);

        if (!isIncluded) {
            const data = { isIncluded, executionOrderIfIncluded, filterByApp, filterByContent, notifications: [] };
            await redisTmpDataManager.storeActionData(taskId, 'getNotificationFromUserDevice', data);
            await this._sendStatus(userId, 'Completed', taskId, messageId, 'getNotificationFromUserDevice', flag_send_status);
            return { success: true, message: 'Notification fetch skipped, not included', data };
        }

        try {
            const notificationResult = await notificationService.requestNotifications(userId, filterByApp, filterByContent, this.sendMessage);
            const data = { isIncluded, executionOrderIfIncluded, filterByApp, filterByContent, notifications: notificationResult.notifications };

            if (notificationResult.success) {
                await redisTmpDataManager.storeActionData(taskId, 'getNotificationFromUserDevice', data);
                await this._sendStatus(userId, 'Completed', taskId, messageId, 'getNotificationFromUserDevice', flag_send_status);
                return { success: true, message: 'Notifications fetched successfully', data };
            } else {
                await this._sendStatus(userId, 'Completed', taskId, messageId, 'getNotificationFromUserDevice', flag_send_status, notificationResult.message);
                return { success: false, message: `Failed to fetch notifications: ${notificationResult.message}`, data };
            }
        } catch (error) {
            console.error('Error getting notifications from user device:', error);
            await this._sendStatus(userId, 'Completed', taskId, messageId, 'getNotificationFromUserDevice', flag_send_status, error.message);
            return { success: false, message: `Error fetching notifications: ${error.message}`, data: null };
        }
    }

    async getCalendarEvents(taskId, isIncluded, executionOrderIfIncluded, timeRange, userId, messageId, flag_send_status = false) {
        await this._sendStatus(userId, 'Starting', taskId, messageId, 'getCalendarEvents', flag_send_status);
        console.log(`[TaskActionExecutorImpl] getCalendarEvents called`);
        if (!isIncluded || Math.random() < 0.3) {
            const data = { isIncluded, executionOrderIfIncluded, timeRange, events: [] };
            await redisTmpDataManager.storeActionData(taskId, 'getCalendarEvents', data);
            await this._sendStatus(userId, 'Completed', taskId, messageId, 'getCalendarEvents', flag_send_status);
            return { success: true, message: 'No calendar events found', data };
        }
        const events = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => ({
            id: uuidv4(),
            title: `Event ${Math.floor(Math.random() * 10)}`,
            start: new Date().toISOString(),
            end: new Date(new Date().getTime() + 3600000).toISOString(), // 1 hour later
        }));
        const data = { isIncluded, executionOrderIfIncluded, timeRange, events };
        await redisTmpDataManager.storeActionData(taskId, 'getCalendarEvents', data);
        await this._sendStatus(userId, 'Completed', taskId, messageId, 'getCalendarEvents', flag_send_status);
        return { success: true, message: 'Calendar events fetched successfully', data };
    }

    async noActionOption(taskId, isIncluded, userId, messageId, flag_send_status = false) {
        await this._sendStatus(userId, 'Starting', taskId, messageId, 'noActionOption', flag_send_status);
        console.log(`[TaskActionExecutorImpl] noActionOption called`);
        const data = { isIncluded };
        await redisTmpDataManager.storeActionData(taskId, 'noActionOption', data);
        await this._sendStatus(userId, 'Completed', taskId, messageId, 'noActionOption', flag_send_status);
        return { success: true, message: 'No action required', data };
    }

    async profileUpdate(taskId, isIncluded, executionOrderIfIncluded, finalEditedInfo, userId, messageId, flag_send_status = false) {
        await this._sendStatus(userId, 'Starting', taskId, messageId, 'profileUpdate', flag_send_status);
        console.log(`[TaskActionExecutorImpl] profileUpdate called`);
        if (!isIncluded) {
            const data = { isIncluded, executionOrderIfIncluded, final_edited_info_only: null };
            await redisTmpDataManager.storeActionData(taskId, 'profileUpdate', data);
            await this._sendStatus(userId, 'Completed', taskId, messageId, 'profileUpdate', flag_send_status);
            return { success: true, message: 'Profile update skipped, no changes needed', data };
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
            await this._sendStatus(userId, 'Completed', taskId, messageId, 'profileUpdate', flag_send_status);
            return { success: true, message: 'Profile updated successfully', data };
        } catch (error) {
            console.error('Error updating profile:', error);
            await this._sendStatus(userId, 'Completed', taskId, messageId, 'profileUpdate', flag_send_status, error.message);
            return { success: false, message: `Failed to update profile: ${error.message}`, data: null };
        }
    }

    async scheduleReminder(taskId, isIncluded, executionOrderIfIncluded, task, userId, messageId, flag_send_status = false) {
        await this._sendStatus(userId, 'Starting', taskId, messageId, 'scheduleReminder', flag_send_status);
        console.log(`[TaskActionExecutorImpl] scheduleReminder called`);

        if (!isIncluded) {
            const data = { isIncluded, executionOrderIfIncluded, task: null };
            await redisTmpDataManager.storeActionData(taskId, 'scheduleReminder', data);
            await this._sendStatus(userId, 'Completed', taskId, messageId, 'scheduleReminder', flag_send_status);
            return { success: true, message: 'Reminder scheduling skipped, not included', data };
        }
        try {
            const scheduleResult = await schedulerService.scheduleReminder(userId, JSON.stringify({ task }));
            const data = { isIncluded, executionOrderIfIncluded, task, scheduleResult };

            if (scheduleResult.success) {
                await redisTmpDataManager.storeActionData(taskId, 'scheduleReminder', data);
                await this._sendStatus(userId, 'Completed', taskId, messageId, 'scheduleReminder', flag_send_status);
                return { success: true, message: `Reminder scheduled successfully with job ID: ${scheduleResult.reminderId}`, data };
            } else {
                await this._sendStatus(userId, 'Completed', taskId, messageId, 'scheduleReminder', flag_send_status, scheduleResult.message);
                return { success: false, message: `Failed to schedule reminder: ${scheduleResult.message}`, data };
            }
        } catch (error) {
            console.error('Error scheduling reminder:', error);
            await this._sendStatus(userId, 'Completed', taskId, messageId, 'scheduleReminder', flag_send_status, error.message);
            return { success: false, message: `Failed to schedule reminder: ${error.message}`, data: null };
        }
    }
}

class TaskActionExecutor {
    constructor(sendMessage) {
        this.taskActionExecutorImpl = new TaskActionExecutorImpl(sendMessage);
    }

    async fetchEmails(taskId, isIncluded, SearchQueryInDetails, executionOrderIfIncluded, userId, messageId, flag_send_status = false) {
        return this.taskActionExecutorImpl.fetchEmails(taskId, isIncluded, SearchQueryInDetails, executionOrderIfIncluded, userId, messageId, flag_send_status);
    }

    async llmPipeline(taskId, isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery, userId, messageId, flag_send_status = false) {
        return this.taskActionExecutorImpl.llmPipeline(taskId, isIncluded, systemInstructions, executionOrderIfIncluded, inputContexts, baseQuery, userId, messageId, flag_send_status);
    }

    async getScreenContext(taskId, isIncluded, executionOrderIfIncluded, userId, messageId, flag_send_status = false) {
        return this.taskActionExecutorImpl.getScreenContext(taskId, isIncluded, executionOrderIfIncluded, userId, messageId, flag_send_status);
    }

    async getNotificationFromUserDevice(taskId, isIncluded, executionOrderIfIncluded, filterByApp, filterByContent, userId, messageId, flag_send_status = false) {
        return this.taskActionExecutorImpl.getNotificationFromUserDevice(taskId, isIncluded, executionOrderIfIncluded, filterByApp, filterByContent, userId, messageId, flag_send_status);
    }

    async getCalendarEvents(taskId, isIncluded, executionOrderIfIncluded, timeRange, userId, messageId, flag_send_status = false) {
        return this.taskActionExecutorImpl.getCalendarEvents(taskId, isIncluded, executionOrderIfIncluded, timeRange, userId, messageId, flag_send_status);
    }

    async noActionOption(taskId, isIncluded, userId, messageId, flag_send_status = false) {
        return this.taskActionExecutorImpl.noActionOption(taskId, isIncluded, userId, messageId, flag_send_status);
    }

    async profileUpdate(taskId, isIncluded, executionOrderIfIncluded, finalEditedInfo, userId, messageId, flag_send_status = false) {
        return this.taskActionExecutorImpl.profileUpdate(taskId, isIncluded, executionOrderIfIncluded, finalEditedInfo, userId, messageId, flag_send_status);
    }

    async scheduleReminder(taskId, isIncluded, executionOrderIfIncluded, task, userId, messageId, flag_send_status = false) {
        return this.taskActionExecutorImpl.scheduleReminder(taskId, isIncluded, executionOrderIfIncluded, task, userId, messageId, flag_send_status);
    }
}

module.exports = { TaskActionExecutor };