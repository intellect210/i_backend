const { sendMessageWithInstructionsWithStructure } = require('../controllers/controller-bot');
const { automationFollowupStructure } = require('../config/config-structureDefinitions');
const { MODELS, TTL_CONFIG } = require('../config/config-constants');
const { TaskQueueService } = require('../services/bullService');
const { v4: uuidv4 } = require('uuid');
const redisManager = require('../utils/respositories/redisManager');

class TaskSchedulerImpl {
    constructor() {
         this.bullService = new TaskQueueService();
    }

    async generatePlan(query) {
        console.log(`[TaskSchedulerImpl] Generating plan for query: ${query}`);
        try {
            const plan = await sendMessageWithInstructionsWithStructure(
                query,
                'automationFollowupInstructions',
                null,
                MODELS.GEMINI_105_FLASH,
                automationFollowupStructure
            );
            console.log(`[TaskSchedulerImpl] Generated plan:`, plan);
            return plan;
        } catch (error) {
            console.error(`[TaskSchedulerImpl] Error generating plan:`, error);
            throw new Error(`Failed to generate task plan: ${error.message}`);
        }
    }

    async enqueuePlan(userId, plan) {
        const scheduleId = uuidv4();
        const queueKey = `taskScheduler:${userId}:${scheduleId}`;
        console.log(`[TaskSchedulerImpl] Enqueueing plan to bullmq for queue: ${queueKey}`);
        try {
            const jobResult = await this.bullService.createJob(
                {
                    userId,
                    scheduleId,
                    plan,
                },
                {
                    jobId: scheduleId, // Use scheduleId as jobId
                    lifetime: 600000, // 10 minutes
                }
            );

            if (!jobResult.success) {
                console.log(
                    `[TaskSchedulerImpl] Failed to enqueue plan to bullmq for queue: ${queueKey} due to ${jobResult.message}`
                );
                throw new Error(`Failed to enqueue plan to queue: ${jobResult.message}`);
            }
            console.log(
                `[TaskSchedulerImpl] Plan enqueued to bullmq successfully, Bull internal job id: ${jobResult.bullInternalJobId} for user ${userId}, scheduleId: ${scheduleId}`
            );
            return {
                success: true,
                message: 'Plan enqueued to bullmq successfully',
                scheduleId,
                bullInternalJobId: jobResult.bullInternalJobId,
                plan,
            };
        } catch (error) {
            console.error(
                `[TaskSchedulerImpl] Error enqueuing plan to bullmq for queue ${queueKey} for user ${userId}, scheduleId: ${scheduleId}:`,
                error
            );
            throw new Error(`Failed to enqueue plan to queue: ${error.message}`);
        }
    }
}

class TaskScheduler {
    constructor() {
        this.taskSchedulerImpl = new TaskSchedulerImpl();
    }

    async scheduleTask(userId, query) {
        console.log(`[TaskScheduler] Scheduling task for user ${userId}, query: ${query}`);
        try {
            const plan = await this.taskSchedulerImpl.generatePlan(query);
            const enqueueStatus = await this.taskSchedulerImpl.enqueuePlan(userId, plan);
            if (!enqueueStatus.success) {
                console.log(
                    `[TaskScheduler] Failed to schedule task for user ${userId}, query: ${query} due to enqueue plan error ${enqueueStatus.message}`
                );
                return {
                    success: false,
                    message: `Failed to schedule task due to enqueue plan error ${enqueueStatus.message}`,
                };
            }
            console.log(`[TaskScheduler] Task scheduled successfully for user ${userId}, query: ${query}`);
            return {
                success: true,
                message: 'Task scheduled successfully',
                scheduleId: enqueueStatus.scheduleId,
                bullInternalJobId: enqueueStatus.bullInternalJobId,
                plan: enqueueStatus.plan,
            };
        } catch (error) {
            console.error(`[TaskScheduler] Error scheduling task for user ${userId}, query: ${query}:`, error);
            return { success: false, message: `Failed to schedule task: ${error.message}` };
        }
    }
}

module.exports = { TaskScheduler };