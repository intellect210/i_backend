const { ERROR_CODES } = require('../../config/config-constants');
const Personalization = require('../../models/personalizationModel');
const { handleBotResponseError } = require('../helpers/error-handlers');
const botController = require('../../controllers/controller-bot');
const AgentStateManager = require('../agents/agent-state-manager');
const websocketService = require('../../services/websocketService');
const agentStateManager = new AgentStateManager(websocketService.sendMessage);
const SchedulerService = require('../../services/schedulerService');
const schedulerService = new SchedulerService();


class ActionExecutor {
    constructor() {
        // No constructor is needed for this layer
    }
    
    async executeAction(actionType, payload, userId, messageId) {
        try {
            switch (actionType) {
                case 'personalInfoUpdate':
                    return await this.handlePersonalInfoUpdateAction(payload, userId, messageId);
                case 'scheduleReminder':
                    return await this.handleScheduleReminderAction(payload, userId, messageId);
                default:
                    console.log("unrecognized action type, stopping agent execution")
                    return { success: false, message: 'Unrecognized action type.' };
                }
            } catch (error) {
                console.error("Error executing action:", error);
                throw error;
            }
        }
    
        async handlePersonalInfoUpdateAction(payload, userId, messageId) {
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
                return { success: false, message: "Failed to update personal info", originalError: error };
            }
        }
    
    async handleScheduleReminderAction(payload, userId, messageId) {
        try {

            // if (!payload || typeof payload !== 'object' || !payload.task) {
            //   throw new Error("Invalid payload for schedule reminder.");
            // }

            const scheduleResult = await schedulerService.scheduleReminder(userId, payload);
          
           if(scheduleResult.success){
             return {
                success: true,
               message: `Reminder scheduled successfully with job ID: ${scheduleResult.reminderId}`,
              };
           }else {
             return {
                success: false,
                message: `Reminder scheduling failed, due to: ${scheduleResult.message}.`,
                };
           }
         }  catch (error) {
               console.error('Error scheduling reminder:', error);
            return { success: false, message: "Failed to schedule reminder.", originalError: error };
          }
    }
}
    module.exports = ActionExecutor;