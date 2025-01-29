// FILE: taskEngine/taskActionDefinitions.js
class TaskActionDefinitions {
    constructor() {
        this.actions = {};
    }

    registerAction(actionName, dataType) {
        if (this.actions[actionName]) {
            throw new Error(`Action ${actionName} is already registered.`);
        }
        this.actions[actionName] = this._createAction(actionName, dataType);
    }

    _createAction(actionName, dataType) {
        return {
            name: actionName,
            dataType,
            dataStructure: (dataId, data) => ({
                dataId,
                type: dataType,
                data,
            }),
        };
    }

    getAction(actionName) {
        const action = this.actions[actionName];
        if (!action) {
            console.warn(`No action definition found for: ${actionName}`);
        }
        return action;
    }

    getAllActions() {
        return this.actions;
    }
}

// Instantiate and register actions
const taskActionDefinitions = new TaskActionDefinitions();
taskActionDefinitions.registerAction('fetchEmails', 'gmail');
taskActionDefinitions.registerAction('llmPipeline', 'llmOutput');
taskActionDefinitions.registerAction('getScreenContext', 'screenContext');
taskActionDefinitions.registerAction('getNotificationFromUserDevice', 'notification');
taskActionDefinitions.registerAction('getCalendarEvents', 'calendar');
taskActionDefinitions.registerAction('noActionOption', 'noAction');
taskActionDefinitions.registerAction('profileUpdate', 'profile');
taskActionDefinitions.registerAction('scheduleReminder', 'reminder');

module.exports = { TaskActionDefinitions: taskActionDefinitions };