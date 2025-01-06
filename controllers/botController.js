const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { v4: uuidv4 } = require("uuid");
const { MODELS, CURRENT_MODEL } = require("../config/constants");
const systemInstructions = require('../utils/systemInstructions');
const CustomGenerationConfig = require('../utils/CustomGenerationConfig');
const { personalInfoUpdateStructure } = require('../utils/structureDefinitions');

// Initialize the generative AI instance using the provided API key
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const botController = {
  /**
   * Streams responses from the bot in real-time.
   * 
   * @param {Object} message - The user message object containing details like chatId and text.
   * @param {string} modelName - The name of the generative AI model to use.
   * @param {Array} history - The chat history to provide context for the response.
   * @param {Object} ws - WebSocket object for streaming responses.
   * @param {Function} handleStream - Callback for handling streamed text chunks.
   * @param {Function} handleStreamError - Callback for handling stream errors.
   */
  streamBotResponse: async (message, modelName, history = [], ws, handleStream, handleStreamError) => {
    const model = genAI.getGenerativeModel({
      model: modelName || MODELS.GEMINI_105_FLASH,
    });

    const chatSession = model.startChat({
      generationConfig: CustomGenerationConfig.getBaseConfig(),
      history,
    });

    const streamId = uuidv4(); // Unique ID for the stream
    const chatId = message.chatId;

    try {
      const result = await chatSession.sendMessageStream(message.message);

      // Process each chunk of the streamed response
      for await (const item of result.stream) {
        const chunkText = item.candidates[0].content.parts[0].text;
        await handleStream(streamId, chatId, chunkText, false, ws);
      }

      // Indicate the end of the stream
      await handleStream(streamId, chatId, "", true, ws);
    } catch (error) {
      console.error("Error in streamBotResponse:", error);

      // Identify the error code and send it via the error handler
      const errorCode = error.code || error.name || "UNKNOWN_ERROR";
      await handleStreamError(streamId, chatId, errorCode, error.message, ws);
    }
  },

  /**
   * Handles synchronous bot responses.
   * 
   * @param {Object} message - The user message object containing details like text.
   * @param {string} modelName - The name of the generative AI model to use.
   * @param {Array} history - The chat history to provide context for the response.
   * @returns {Promise<string>} - The response text from the model.
   */
  handleBotResponse: async (message, modelName, history = []) => {
    console.log("Model Name in handleBotResponse:", MODELS.GEMINI_105_FLASH);

    const model = genAI.getGenerativeModel({
      model: MODELS.GEMINI_105_FLASH,
    });

    const chatSession = model.startChat({
      generationConfig: CustomGenerationConfig.getBaseConfig(),
      history,
    });

    const result = await chatSession.sendMessage(message);
    return result.response.text();
  },

  /**
   * Sends a message with system instructions.
   * 
   * @param {string} message - The user message text.
   * @param {string} instructionKey - The key to retrieve specific instructions.
   * @param {Object} [instructionOptions] - Additional options for instruction customization.
   * @param {string} [curr_model] - The name of the model to use.
   * @returns {Promise<string>} - The response text from the model.
   */
  sendMessageWithInstructions: async (message, instructionKey, instructionOptions = null, curr_model = CURRENT_MODEL) => {
    const instructions = systemInstructions.getInstructions(instructionKey, instructionOptions);

    const model = genAI.getGenerativeModel({
      model: curr_model || CURRENT_MODEL,
      systemInstruction: instructions,
      generationConfig: CustomGenerationConfig.getBaseConfig(),
    });

    const modifiedMessage = `User Query: ${message}`;

    try {
      const result = await model.generateContent(modifiedMessage);
      return result.response.text();
    } catch (error) {
      console.error("Error generating content with instructions:", error);
      throw error;
    }
  },

  /**
   * Sends a message with system instructions and a custom response structure.
   * 
   * @param {string} message - The user message text.
   * @param {string} instructionKey - The key to retrieve specific instructions.
   * @param {Object} [instructionOptions] - Additional options for instruction customization.
   * @param {string} [curr_model] - The name of the model to use.
   * @param {Object} [customStructure] - Custom response structure for generation.
   * @param {Array} [history] - The chat history to provide context for the response.
   * @returns {Promise<string>} - The response text from the model.
   */
  sendMessageWithInstructionsWithStructure: async (message, instructionKey, instructionOptions = null, curr_model = CURRENT_MODEL, customStructure = null, history = []) => {
    const instructions = systemInstructions.getInstructions(instructionKey, instructionOptions);

    const generationConfigToUse = customStructure
      ? CustomGenerationConfig.getConfigWithStructure(customStructure)
      : CustomGenerationConfig.getBaseConfig();

    const model = genAI.getGenerativeModel({
      model: curr_model || CURRENT_MODEL,
      systemInstruction: instructions,
    });

    const modifiedMessage = `User Query: ${message}`;

    try {
      const chatSession = model.startChat({
        generationConfig: generationConfigToUse,
        history,
      });

      const result = await chatSession.sendMessage(modifiedMessage);
      console.log(result.response.text());

      return result.response.text();
    } catch (error) {
      console.error("Error generating content with instructions:", error);
      throw error;
    }
  },
};

module.exports = botController;
