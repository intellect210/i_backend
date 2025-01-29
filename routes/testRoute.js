const express = require('express');
const router = express.Router();
const { TaskScheduler } = require('../taskEngine/taskSchedulerEngine');
const { TaskExecutorEngine } = require('../taskEngine/taskExecutorEngine');

// const taskScheduler = new TaskScheduler();
// const taskExecutorEngine = new TaskExecutorEngine();

// // Route to test scheduleTask
// router.post('/scheduleTask', async (req, res) => {
//     try {
//         const { userId, query } = req.body;
//         if (!userId || !query) {
//             return res.status(400).json({ message: 'User ID and query are required' });
//         }
//         const response = await taskScheduler.scheduleTask(userId, query);
//         res.json(response);
//     } catch (error) {
//         console.error('Error testing scheduleTask:', error);
//         res.status(500).json({ message: 'Error testing scheduleTask', error: error.message });
//     }
// });

// // Route to test executeTask
// router.post('/executeTask', async (req, res) => {
//     try {
//         const { userId, taskId, plan } = req.body;
//         if (!userId || !taskId || !plan) {
//             return res.status(400).json({ message: 'User ID, task ID, and plan are required' });
//         }
//         const response = await taskExecutorEngine.executeTask(userId, taskId, plan);
//         res.json(response);
//     } catch (error) {
//         console.error('Error testing executeTask:', error);
//         res.status(500).json({ message: 'Error testing executeTask', error: error.message });
//     }
// });

module.exports = router;