const { MODELS } = require('../../config/config-constants');
const botController = require('../../controllers/botController');
const { classificationResultBoolStructure } = require('../../utils/structureDefinitions');

/**
 * Manages message classification using the botController.
 */
class ClassificationManager {
  /**
   * Classifies a given message to determine a boolean result.
   *
   * @param {string} message - The message to classify.
   * @returns {Promise<boolean>} - Returns true if the message meets the classification criteria, otherwise false.
   */
  async classifyMessage(message) {
    try {
      // Send the message to the botController with the specified structure and instructions
      const classificationResult = await botController.sendMessageWithInstructionsWithStructure(
        message,
        'temoprary_single_classification', // Key for system instructions
        null,                              // No additional options for instructions
        MODELS.GEMINI_105_FLASH_8B,        // Model name for classification
        classificationResultBoolStructure  // Expected structure for the response
      );

      console.log("Classification result:", classificationResult);

      // Parse the classification result and check for a valid boolean classification
      const parsed = JSON.parse(classificationResult);
      if (parsed && typeof parsed.classification === 'boolean') {
        return parsed.classification;
      }

      // Return false if parsing fails or classification is not a boolean
      return false;
    } catch (error) {
      // Log the error and return false for any failure during classification
      console.error("Classification error:", error);
      return false;
    }
  }
}

module.exports = ClassificationManager;
