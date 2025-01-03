// FILE: utils/actionExecutor.txt
const { ERROR_CODES } = require('../config/constants');
const Personalization = require('../models/personalizationModel');
const { handleBotResponseError } = require('./errorHandlers');
const botController = require('../controllers/botController');
class ActionExecutor {
    constructor() {
        // No constructor is needed for this layer
    }

    async executeAction(actionType, payload, userId) {
        try {
            switch (actionType) {
                case 'personalInfoUpdate':
                    return await this.handlePersonalInfoUpdateAction(payload, userId);
                default:
                    throw new Error(`Invalid action type: ${actionType}`);
            }
        } catch (error) {
            console.error("Error executing action:", error);
            throw error;
        }
    }

async handlePersonalInfoUpdateAction(payload, userId) {
    try {
        if (!payload || typeof payload !== 'object' || !payload.final_edited_info_only) {
            throw new Error("Invalid payload for personal info update.");
        }

        const { final_edited_info_only } = payload;

        let personalization = await Personalization.findOne({ useruid: userId });
        if (!personalization) {
            personalization = new Personalization({ useruid: userId, personalInfo: final_edited_info_only });
        } else {
            personalization.personalInfo = final_edited_info_only;
        }

        await personalization.save();
        return { success: true, message: 'Personal info updated successfully', updatedInfo: personalization.personalInfo };
    } catch (error) {
        console.error('Error updating personal info:', error);
        throw { code: ERROR_CODES.DATABASE_ERROR, message: "Failed to update personal info", originalError: error };
    }
}
}
module.exports = ActionExecutor;