// I_BACKEND/services/classificationService.txt
const { sendMessageWithInstructionsWithStructure } = require('../controllers/botController');
const { classifications } = require('../config/config-classifications');
const { DEFAULT_CLASSIFICATION, MODELS } = require('../config/config-constants');
const systemInstructions = require('../utils/systemInstructions');
const { classificationResultStructure, combinedActionStructure } = require('../utils/structureDefinitions');
const agentUtils = require('../utils/agentUtils');

const classificationService = {
    sanitizeOutput: (output) => {
        try {
            // Remove any text before the first opening curly brace and after the last closing curly brace
            const jsonString = output.substring(output.indexOf('{'), output.lastIndexOf('}') + 1);
            JSON.parse(jsonString);
            return jsonString;
        } catch (error) {
            console.error('Error sanitizing output:', error);
            return JSON.stringify({ payload: { classification: "no_action_needed" } });
        }
    },
    classify: async (text, history) => {
        try {
            const agentConfig = await agentUtils.getAgentConfig();
            const result = await sendMessageWithInstructionsWithStructure(
                `Current user message: ${text}.`,
                'classify_and_act',
                { agentConfig },
                MODELS.GEMINI_105_FLASH,
                 combinedActionStructure,
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
            return { payload: { classification: "no_action_needed" } };
        }
    },
};

module.exports = classificationService;