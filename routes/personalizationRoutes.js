const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Personalization = require('../models/personalizationModel');
const logger = require('../utils/logger');

// POST /personalization/integration/info
router.post('/integration/info', authMiddleware, async (req, res) => {
  try {
    console.log('[DEBUG] POST /integration/info - Request received');
    const useruid = req.user.useruid;
    const { personalised_name, model_behaviour, personal_info } = req.body;

    console.log('[DEBUG] POST /integration/info - User UID:', useruid);
    console.log('[DEBUG] POST /integration/info - Request body:', req.body);

    let personalization = await Personalization.findOne({ useruid });


    if (personalization) {
      console.log('[DEBUG] POST /integration/info - Existing personalization found');
      // Update existing document
      personalization.personalisedName =
        personalised_name !== undefined ? personalised_name : personalization.personalisedName;
      personalization.modelBehaviour =
        model_behaviour !== undefined ? model_behaviour : personalization.modelBehaviour;
      personalization.personalInfo =
        personal_info !== undefined ? personal_info : personalization.personalInfo;

        console.log('[DEBUG] POST /integration/info - Personalization:', personalization);
    } else {
      console.log('[DEBUG] POST /integration/info - No existing personalization found, creating new one');
      // Create new document
      personalization = new Personalization({
        useruid,
        personalisedName: personalised_name || 'intellect',
        modelBehaviour: model_behaviour || '',
        personalInfo: personal_info || '',
      });
    }

    await personalization.save();
    console.log('[DEBUG] POST /integration/info - Personalization saved');
    res.status(200).json({ message: 'Personalization information updated' });
  } catch (error) {
    console.log('[DEBUG] POST /integration/info - Error:', error);
    logger.error('Error updating personalization information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /personalization/integration/info
router.get('/integration/info', authMiddleware, async (req, res) => {
  try {
    console.log('[DEBUG] GET /integration/info - Request received');
    const useruid = req.user.useruid;

    console.log('[DEBUG] GET /integration/info - User UID:', useruid);

    const personalization = await Personalization.findOne({ useruid });

    if (personalization) {
      console.log('[DEBUG] GET /integration/info - Personalization found');
      res.status(200).json({
        personalisedName: personalization.personalisedName,
        modelBehaviour: personalization.modelBehaviour,
        personalInfo: personalization.personalInfo,
      });
    } else {
      console.log('[DEBUG] GET /integration/info - No personalization found, returning default values');
      res.status(200).json({
        personalisedName: 'intellect',
        modelBehaviour: '',
        personalInfo: '',
      });
    }
  } catch (error) {
    console.log('[DEBUG] GET /integration/info - Error:', error);
    logger.error('Error fetching personalization information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;