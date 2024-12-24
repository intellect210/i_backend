// FILE: botController.txt
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { v4: uuidv4 } = require("uuid");
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

  streamBotResponse: async (
    message,
    modelName,
    history = [],
    ws,
    handleStream,
    handleStreamError
  ) => {
    const model = genAI.getGenerativeModel({
      model: modelName ? modelName : CURRENT_MODEL,
    });

    const chatSession = model.startChat({
      generationConfig,
      history,
    });

    const streamId = uuidv4(); // Generate streamId here
    const chatId = message.chatId;

    try {
      const result = await chatSession.sendMessageStream(message.message);

      for await (const item of result.stream) {
        const chunkText = item.candidates[0].content.parts[0].text;
        await handleStream(streamId, chatId, chunkText, false, ws);
      }

      // Signal the end of the stream
      await handleStream(streamId, chatId, "", true, ws);
    } catch (error) {
      // console.error("Error in streamBotResponse:", error);
      let errorCode = "UNKNOWN_ERROR";

      if (error.code) {
        errorCode = error.code;
      } else if (error.name) {
        errorCode = error.name;
      }

      await handleStreamError(streamId, chatId, errorCode, error.message, ws);
    }
  },

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

  sendMessageWithInstructions: async (
    message,
    instructionKey,
    instructionOptions = null,
    curr_model = CURRENT_MODEL
  ) => {
    const model = genAI.getGenerativeModel({
      model: curr_model ? curr_model : CURRENT_MODEL, // Use the same model as the main chat
      generationConfig, // Use the same generation config
    });

    const instructions = systemInstructions.getInstructions(
      instructionKey,
      instructionOptions
    );
    const modifiedMessage = `Instructions: ${instructions}\n\nUser Query: ${message}`;

    try {
      const result = await model.generateContent(modifiedMessage);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating content with instructions:", error);
      throw error; // Re-throw to be handled by the caller
    }
  },

  classifyText: async (text) => {
    try {
      const response = await botController.sendMessageWithInstructions(
        text,
        "temoprary_single_classification"
      );
      return response;
    } catch (error) {
      console.error("Error during text classification:", error);
      throw error; // Re-throw to be handled by the caller
    }
  },
};

module.exports = botController;