// FILE: controllers/taskController.js
// Task controller with no changes
const Task = require('../models/taskModel');
const { handleDatabaseError } = require('../utils/helpers/error-handlers');
const { v4: uuidv4 } = require('uuid');

const taskController = {
    /**
     * Creates a new task in the database.
     * @param {string} userId - The ID of the user creating the task.
     * @param {object} plan - The task plan.
     * @returns {Promise<Task>} - The created task object.
     */
    createTask: async (userId, plan) => {
        try {
            const taskId = uuidv4();
           const newTask = new Task({
                taskId: taskId,
                userId: userId,
               plan: JSON.stringify(plan),
            });
            await newTask.save();
            return newTask;
        } catch (error) {
            handleDatabaseError(error, null, null, userId);
            throw new Error('Error creating a new task.');
        }
    },

    /**
     * Retrieves a task by its taskId.
     * @param {string} taskId - The ID of the task to retrieve.
     * @returns {Promise<Task|null>} - The task object or null if not found.
     */
    getTask: async (taskId) => {
        try {
            const task = await Task.findOne({ taskId: taskId });
            return task;
        } catch (error) {
            handleDatabaseError(error, null, null, null);
            throw new Error('Error fetching task by taskId.');
        }
    },


    /**
     * Retrieves all tasks by userId.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Task|null>} - The task object or null if not found.
     */
    getTasksByUserId: async (userId) => {
      try {
          const tasks = await Task.find({ userId: userId });
          return tasks;
      } catch (error) {
          handleDatabaseError(error, null, null, userId);
          throw new Error('Error fetching tasks by userId.');
      }
    },
    /**
     * Retrieves all tasks.
     * @returns {Promise<Task|null>} - The task object or null if not found.
     */
     getAllTasks: async () => {
        try {
            const tasks = await Task.find();
            return tasks;
        } catch (error) {
            handleDatabaseError(error, null, null, null);
            throw new Error('Error fetching all tasks.');
        }
    },

    /**
     * Adds or updates messageId and chatId of a task.
     * @param {string} taskId - The ID of the task to update.
     * @param {string|null} messageId - The ID of the message or null.
     * @param {string|null} chatId - The ID of the chat or null.
     * @returns {Promise<Task>} - The updated task object.
     */
    addTaskDetails: async (taskId, messageId, chatId) => {
      try {
          const updateFields = {};
          if (messageId !== undefined) {
              updateFields.messageId = messageId;
          }
          if (chatId !== undefined) {
              updateFields.chatId = chatId;
          }
          const updatedTask = await Task.findOneAndUpdate(
              { taskId: taskId },
              updateFields,
              { new: true }
          );
          return updatedTask;
      } catch (error) {
            handleDatabaseError(error, null, null, null);
            throw new Error('Error adding details to task.');
        }
    },

     /**
      * Adds a new status to the executionStatus array of a task.
      * @param {string} taskId - The ID of the task.
      * @param {string} status - The new status message.
      *  @returns {Promise<Task>} - The updated task object.
      */
    addExecutionStatus: async (taskId, agentStateId) => {
         try {
            const task = await Task.findOne({ taskId: taskId });
             if (!task) {
                throw new Error('Task not found');
             }
              task.executionStatus.push(agentStateId);
            await task.save();
           return task;
         } catch (error) {
             handleDatabaseError(error, null, null, null);
              throw new Error('Error adding status to task.');
         }
    },

};
module.exports = taskController;