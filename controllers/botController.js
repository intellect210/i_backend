const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { CURRENT_MODEL } = require("../config/constants");
const systemInstructions = require('../utils/systemInstructions');

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

  sendMessageWithInstructions: async (message, instructionKey) => {
    const model = genAI.getGenerativeModel({
      model: CURRENT_MODEL, // Use the same model as the main chat
      generationConfig, // Use the same generation config
    });

    const instructions = systemInstructions.getInstructions(instructionKey);
    const modifiedMessage = `${instructions}\n\nUser: ${message}`;

    try {
      const result = await model.generateContent(modifiedMessage);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating content with instructions:', error);
      throw error; // Re-throw to be handled by the caller
    }
  },
};

module.exports = botController;