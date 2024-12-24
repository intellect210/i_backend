// FILE: routes/vectorRoutes.js
const express = require('express');
const router = express.Router();
const PineconeService = require('../services/pineconeService');

// Initialize PineconeService instance
const pineconeService = new PineconeService();

// Test route to add data to Pinecone
router.post('/add', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const id = await pineconeService.addData(text);
    res.status(201).json({ message: 'Data added successfully', id });
  } catch (error) {
    console.error('Error adding data:', error);
    res.status(500).json({ error: 'Failed to add data' });
  }
});

// Test route to query data from Pinecone
router.post('/query', async (req, res) => {
  try {
    const { message, queryParams } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const results = await pineconeService.queryData(message, queryParams);
    res.status(200).json({ results });
  } catch (error) {
    console.error('Error querying data:', error);
    res.status(500).json({ error: 'Failed to query data' });
  }
});

module.exports = router;