// FILE: controllers/botController.js
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { CURRENT_MODEL } = require("../config/constants");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const generationConfig = {
  temperature: 0.75,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 4200,
};

const botController = {
  handleBotResponse: async (message, modelName, history = []) => {
    const model = genAI.getGenerativeModel({
      model: modelName ? modelName : CURRENT_MODEL,
    });

    const chatSession = model.startChat({
      generationConfig,
      history,
    });

    const result = await chatSession.sendMessage(message.message);
    return result.response.text();
  },
};

module.exports = botController;
