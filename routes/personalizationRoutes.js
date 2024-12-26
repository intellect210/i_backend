const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Personalization = require('../models/personalizationModel');
const logger = require('../utils/logger');


// POST /personalization/integration/info
router.post('/integration/info', authMiddleware, async (req, res) => {
  try {
    const useruid = req.user.useruid;
    const { personalisedName, modelBehaviour, personalInfo } = req.body;

    let personalization = await Personalization.findOne({ useruid });

    if (personalization) {
      // Update existing document
      personalization.personalisedName =
        personalisedName !== undefined ? personalisedName : personalization.personalisedName;
      personalization.modelBehaviour =
        modelBehaviour !== undefined ? modelBehaviour : personalization.modelBehaviour;
      personalization.personalInfo =
        personalInfo !== undefined ? personalInfo : personalization.personalInfo;
    } else {
      // Create new document
      personalization = new Personalization({
        useruid,
        personalisedName: personalisedName || 'intellect',
        modelBehaviour: modelBehaviour || '',
        personalInfo: personalInfo || '',
      });
    }

    await personalization.save();
    res.status(200).json({ message: 'Personalization information updated' });
  } catch (error) {
    logger.error('Error updating personalization information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /personalization/integration/info
router.get('/integration/info', authMiddleware, async (req, res) => {
  try {
    const useruid = req.user.useruid;

    const personalization = await Personalization.findOne({ useruid });

    if (personalization) {
      res.status(200).json({
        personalisedName: personalization.personalisedName,
        modelBehaviour: personalization.modelBehaviour,
        personalInfo: personalization.personalInfo,
      });
    } else {
      res.status(200).json({
        personalisedName: 'intellect',
        modelBehaviour: '',
        personalInfo: '',
      });
    }
  } catch (error) {
    logger.error('Error fetching personalization information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;