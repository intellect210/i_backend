// I_BACKEND/services/classificationService.txt
const { sendMessageWithInstructionsWithStructure } = require('../controllers/controller-bot');
const { classifications } = require('../config/config-classifications');
const { DEFAULT_CLASSIFICATION, MODELS } = require('../config/config-constants');
const systemInstructions = require('../config/config-systemInstructions.js');
const { classificationResultStructure, combinedActionStructure, automationFollowupStructure } = require('../config/config-structureDefinitions');
const agentUtils = require('../utils/agents/agent-helper');

const classificationService = {
    sanitizeOutput: (output) => {
        try {
            // Remove any text before the first opening curly brace and after the last closing curly brace
            const jsonString = output.substring(output.indexOf('{'), output.lastIndexOf('}') + 1);
            JSON.parse(jsonString);
            return jsonString;
        } catch (error) {
            console.error('Error sanitizing output:', error);
            return JSON.stringify({ actions: { noActionOption: { isIncluded: true } } });
        }
    },
    classify: async (text, history) => {
        try {
            const agentConfig = await agentUtils.getAgentConfig();
            const result = await sendMessageWithInstructionsWithStructure(
                `Current user message: ${text}.`,
                'automationFollowupInstructions',
                { agentConfig },
                MODELS.GEMINI_105_FLASH,
                automationFollowupStructure,
                [
                    ...history,
                    {
                        role: 'user',
                        parts: [{ text: `Current agent configuration: ${JSON.stringify(agentConfig)}` }],
                    },
                    {
                        role: 'model',
                        parts: [{ text: 'Understood. I will classify based on provided agent configuration.' }],
                    },
                ]
            );

            // console.log("Classification result before sanitization:", result);
            const sanitizedResult = classificationService.sanitizeOutput(result);
            // console.log("Classification result after sanitization:", sanitizedResult);

            return JSON.parse(sanitizedResult);

        } catch (error) {
            console.error('Error during classification:', error);
            return { actions: { noActionOption: { isIncluded: true } } };
        }
    },
};

module.exports = classificationService;