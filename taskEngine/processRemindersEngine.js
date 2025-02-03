// FILE: taskEngine/processRemindersEngine.txt
const { TaskExecutorEngine } = require('./taskExecutorEngine');
const classificationService = require('../services/classificationService');
const { notificationResponseStructure } = require('../config/config-structureDefinitions');
const { sendMessageWithInstructionsWithStructure } = require('../controllers/controller-bot');
const { automationFollowupStructure } = require('../config/config-structureDefinitions');
const { MODELS } = require('../config/config-constants');
const PersonalizationService = require('../services/personalizationService');
const dateTimeUtils = require('../utils/helpers/data-time-helper');
const DataInjector = require('../utils/helpers/data-injector');
const systemInstructions = require('../config/config-systemInstructions.js');

const taskExecutorEngine = new TaskExecutorEngine();
const personalizationService = new PersonalizationService();
const dataInjector = new DataInjector();

const processRemindersEngine = {
    async processReminder(taskDescription, userId) {
        console.log(`[processRemindersEngine] Processing reminder for task: ${taskDescription}`);
        try {
            // Build personalization and history
            let history = [];
            const personalizationInfo = await personalizationService.getPersonalizationInfo(userId);
            const currentDateTimeIST = dateTimeUtils.getCurrentDateTimeIST();

            const infoText = `SYSTEM GIVEN INFO - , Current Date and time (take this as a fact): ${currentDateTimeIST},Model personalised Name: ${personalizationInfo.personalisedName}, Follow given Model Behaviour: ${personalizationInfo.modelBehaviour}, Personal Info of user to use whenever necessary: ${personalizationInfo.personalInfo}`;

            console.log(`[processRemindersEngine] Personalization info: ${infoText}`);
            // Inject system instructions and personalization info into history
            history = dataInjector.injectData(
                history,
                systemInstructions.getInstructions('assistantBehaviorPrompt'),
                'Understood. I follow the given instructions.'
            );

            history = dataInjector.injectData(
                history,
                infoText,
                'Understood. I will keep these in mind for conversations.'
            );

            const classificationResult = await classificationService.classify(taskDescription, history);

            if (classificationResult.actions.noActionOption && classificationResult.actions.noActionOption.isIncluded) {
                console.log(`[processRemindersEngine] No action needed for task: ${taskDescription}, generating notification directly.`);
                const notificationResponse = await sendMessageWithInstructionsWithStructure(
                    taskDescription,
                    'default',
                    history,
                    MODELS.GEMINI_105_FLASH,
                    notificationResponseStructure
                );

                console.log(`[processRemindersEngine] Generated notification response without actions for task: ${taskDescription}`);
                return notificationResponse;
            }

            const taskExecutionResult = await taskExecutorEngine.executeTask(
                null,
                taskDescription,
                classificationResult,
                null,
                false,
                null
            );
            let finalQuery = `User query: ${taskDescription}. \n System context: ${taskExecutionResult.finalQuery} `;
            const notificationResponse = await sendMessageWithInstructionsWithStructure(
                finalQuery,
                'notificationAgent',
                history,
                MODELS.GEMINI_105_FLASH,
                notificationResponseStructure
            );
            console.log(`[processRemindersEngine] Generated notification response with actions for task: ${taskDescription}`);
            return notificationResponse;
        } catch (error) {
            console.error(`[processRemindersEngine] Error processing reminder for task: ${taskDescription}:`, error);
            throw new Error(`Failed to process reminder: ${error.message}`);
        }
    },
};

module.exports = processRemindersEngine;