// FILE: taskEngine/processRemindersEngine.txt
const { TaskExecutorEngine } = require('./taskExecutorEngine');
const classificationService = require('../services/classificationService');
const { notificationResponseStructure } = require('../config/config-structureDefinitions');
const { sendMessageWithInstructionsWithStructure } = require('../controllers/controller-bot');
const { automationFollowupStructure } = require('../config/config-structureDefinitions');
const { MODELS } = require('../config/config-constants');
const taskExecutorEngine = new TaskExecutorEngine();

const processRemindersEngine = {
    async processReminder(taskDescription) {
        console.log(`[processRemindersEngine] Processing reminder for task: ${taskDescription}`);
        try {
            const classificationResult = await classificationService.classify(taskDescription, null);

            if (classificationResult.actions.noActionOption && classificationResult.actions.noActionOption.isIncluded) {
                console.log(`[processRemindersEngine] No action needed for task: ${taskDescription}, generating notification directly.`);
                const notificationResponse = await sendMessageWithInstructionsWithStructure(
                    taskDescription,
                    'default',
                    null,
                    MODELS.GEMINI_105_FLASH,
                    notificationResponseStructure
                );

                 console.log(`[processRemindersEngine] Generated notification response without actions for task: ${taskDescription}`);
                 return notificationResponse;
            }

            //  console.log(`[processRemindersEngine] Action required for task: ${taskDescription}, getting plan.`);
            // const plan = await sendMessageWithInstructionsWithStructure(
            //      taskDescription,
            //      'automationFollowupInstructions',
            //     null,
            //      MODELS.GEMINI_105_FLASH,
            //      automationFollowupStructure,
            // );

            const taskExecutionResult = await taskExecutorEngine.executeTask(
                null,
                taskDescription,
                classificationResult,
               null,
                false, // This flag ensures no websocket message is sent from executeTask.
               null
            );
             let finalQuery = `User query: ${taskDescription}. \n System context: ${taskExecutionResult.finalQuery} `;
             const notificationResponse = await sendMessageWithInstructionsWithStructure(
                finalQuery,
                'default',
                null,
                MODELS.GEMINI_105_FLASH,
                 notificationResponseStructure
            );
             console.log(`[processRemindersEngine] Generated notification response with actions for task: ${taskDescription}`);
             return notificationResponse
        } catch (error) {
            console.error(`[processRemindersEngine] Error processing reminder for task: ${taskDescription}:`, error);
            throw new Error(`Failed to process reminder: ${error.message}`);
        }
    },
};

module.exports = processRemindersEngine;