// FILE: taskEngine/redisTmpDataManagerForTasks.js
const { v4: uuidv4 } = require('uuid');
const { TaskActionDefinitions } = require('./TaskActionDefinitions');
const redisManager = require('../utils/respositories/redisManager');

class RedisTmpDataManagerForTasks {
    constructor() {
        this.redisManager = redisManager;
    }

    generateDataId() {
        return uuidv4();
    }

    async storeActionData(taskId, actionType, data) {
        const dataId = this.generateDataId();
        const actionDefinition = TaskActionDefinitions.getAction(actionType);

        if (!actionDefinition) {
            console.warn(`No definition found for action type: ${actionType}`);
            return this._createResponse(false, `No definition found for action type: ${actionType}`);
        }

        const prefixedData = actionDefinition.dataStructure(dataId, data);
        const key = this._generateKey(taskId, prefixedData.type);
        console.log(`Storing data for task ${taskId}, actionType: ${actionType} with key: ${key}`);

        try {
            const existingDataList = await this._getExistingDataList(key);
            existingDataList.push(this._createDataEntry(prefixedData));
            await this._setData(key, existingDataList);
            return this._createResponse(true, `Data stored successfully for task ${taskId}, actionType: ${actionType}`, prefixedData.dataId);
        } catch (error) {
            console.error(`Error storing data for task ${taskId}, actionType: ${actionType} with key: ${key}:`, error);
            throw new Error(`Failed to store data for task ${taskId}, actionType: ${actionType}: ${error.message}`);
        }
    }

async getActionData(taskId) {
        console.log(`Getting all action data for task: ${taskId}`);
        try {
            let cursor = '0';
            let keys = [];
            do {
                // Use sendCommand for SCAN
                const reply = await this.redisManager.sendCommand(['SCAN', cursor, 'MATCH', `task:${taskId}:*`, 'COUNT', '100']);
                cursor = reply[0];
                keys = keys.concat(reply[1]);
            } while (cursor !== '0');

            if (!keys || keys.length === 0) {
                console.log(`No keys found for task: ${taskId}`);
                return null;
            }

            const allData = await this._getAllData(keys);
            console.log(`Successfully retrieved all action data for task: ${taskId}`);
            return allData;
        } catch (error) {
            console.error(`Error getting action data for task: ${taskId}:`, error);
            return null;
        }
    }

    async clearTaskData(taskId) {
        console.log(`Clearing all data for task: ${taskId}`);
        try {
            let cursor = '0';
            let keys = [];
            do {
                // Use sendCommand for SCAN
                const reply = await this.redisManager.sendCommand(['SCAN', cursor, 'MATCH', `task:${taskId}:*`, 'COUNT', '100']);
                cursor = reply[0];
                keys = keys.concat(reply[1]);
            } while (cursor !== '0');

            if (!keys || keys.length === 0) {
                console.log(`No keys found for task: ${taskId}`);
                return true;
            }

            // Use DEL to remove the keys
            await this.redisManager.del(keys); // Corrected: Use del directly
            console.log(`Successfully cleared all data for task: ${taskId}`);
            return true;
        } catch (error) {
            console.error(`Error clearing all data for task: ${taskId}:`, error);
            return false;
        }
    }

    // Private helper methods
    _generateKey(taskId, type) {
        return `task:${taskId}:${type}`;
    }

    async _getExistingDataList(key) {
        const existingData = await this.redisManager.get(key);
        return existingData ? JSON.parse(existingData) : [];
    }

    _createDataEntry(prefixedData) {
        return { ...prefixedData, status: 'completed', timestamp: Date.now() };
    }

    async _setData(key, dataList) {
        const success = await this.redisManager.set(key, JSON.stringify(dataList), { EX: 600 });
        if (!success) {
            throw new Error(`Failed to store data for key: ${key}`);
        }
    }

    async _getAllData(keys) {
        const allData = await Promise.all(keys.map(async (key) => {
            const data = await this.redisManager.get(key);
            return data ? JSON.parse(data) : [];
        }));
        return allData.flat();
    }

    _createResponse(success, message, dataId = null) {
        return { success, message, dataId };
    }
}

module.exports = { RedisTmpDataManagerForTasks };