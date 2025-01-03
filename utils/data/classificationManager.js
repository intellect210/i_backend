// FILE: utils/data/classificationManager.txt
const { MODELS } = require('../../config/constants');
const botController = require('../../controllers/botController');

class ClassificationManager {
    constructor() {
        // No constructor needed for this class for now
    }

    async classifyMessage(message) {
      try{
          const classificationResult = await botController.sendMessageWithInstructions(
            message,
            'temoprary_single_classification',
            null,
            MODELS.GEMINI_105_FLASH_8B
          );

          console.log("[DEBUG: ]Classification Result:", classificationResult);

          if (classificationResult == "0" || classificationResult == 0) {
              return false;
          }else{
            return true;
          }
      }
       catch(error){
           console.error("classification error:", error);
            return false;
       }
    }
}

module.exports = ClassificationManager;