const express = require('express');
const router = express.Router();
const { getServiceStatus } = require('../utils/serviceStatus');

router.get('/service', async (req, res) => {
  try {
    const status = await getServiceStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;