// services/classificationService.js
const {sendMessageWithInstructions} = require('../controllers/botController');
const { classifications } = require('../config/classifications');
const { DEFAULT_CLASSIFICATION } = require('../config/constants');

const ClassificationService = {
   classify: async(text) => {
    try {
      const classificationKeys = Object.keys(classifications);
      const classificationResult = await sendMessageWithInstructions(
        text,
        'temoprary_single_classification',
        classifications
      );

      const key = parseInt(classificationResult);

      if (!isNaN(key) && key >= 0 && key < classificationKeys.length) {
        return classificationKeys[key];
      } else {
        console.warn(
          `Invalid classification result: ${classificationResult}. Using default classification.`
        );
        return DEFAULT_CLASSIFICATION;
      }
    } catch (error) {
      console.error('Error during classification:', error);
      return DEFAULT_CLASSIFICATION;
    }
  }
}

module.exports = ClassificationService;