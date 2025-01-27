const Personalization = require('../../models/personalizationModel');
const SchedulerService = require('../../services/schedulerService');
const schedulerService = new SchedulerService();

class ActionExecutor {
    async executeAction(actionType, payload, userId, messageId) {
        try {
            const actionHandlers = {
                personalInfoUpdate: this.handlePersonalInfoUpdateAction,
                scheduleReminder: this.handleScheduleReminderAction,
            };

            if (!actionHandlers[actionType]) {
                console.log("Unrecognized action type, stopping agent execution");
                return { success: false, message: 'Unrecognized action type.' };
            }

            return await actionHandlers[actionType].call(this, payload, userId, messageId);
        } catch (error) {
            console.error("Error executing action:", error);
            throw error;
        }
    }

    async handlePersonalInfoUpdateAction(payload, userId) {
        try {
            if (!this.isValidPayload(payload, 'final_edited_info_only')) {
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

            return { 
                success: true, 
                message: 'Personal info updated successfully', 
                updatedInfo: personalization.personalInfo 
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

    async handleScheduleReminderAction(payload, userId) {
        try {
            const scheduleResult = await schedulerService.scheduleReminder(userId, payload);

            if (scheduleResult.success) {
                return {
                    success: true,
                    message: `Reminder scheduled successfully with job ID: ${scheduleResult.reminderId}`,
                };
            } else {
                return {
                    success: false,
                    message: `Reminder scheduling failed due to: ${scheduleResult.message}.`,
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

    isValidPayload(payload, requiredField) {
        return payload && typeof payload === 'object' && requiredField in payload;
    }
}

module.exports = ActionExecutor;
