const systemInstructions = {
  instructions: {
    default: 'You are a helpful chatbot.',
    chatTitleGeneration:
      'You are a title Generator a concise and relevant title for this chat based on the user message. The title should be more than 7 words and less than 13 words. (no matter the message size, title should be generated.)',
    summary: 'Provide a brief summary of the following conversation.',
    // Add more instructions as needed
    dataInjection: "You are a chatbot that uses provided data to answer questions. When data is injected, prioritize it over your general knowledge. If you don't know the answer based on the provided data, just respond gracefully.",
    temoprary_single_classification: (classificationList) => {
      const formattedList = Object.keys(classificationList)
        .map((key, index) => `${index} for ${key}`)
        .join(", ");
      return `Classify the following text into one of the following categories: [${formattedList}]. Return only the numerical key corresponding to the category (e.g., ${formattedList}). Make sure to return only one key, and it should be a valid number within the range. no other text just the integer.`;
    },
  },

  getInstructions: (key, options = null) => {
    if (
      systemInstructions.instructions[key] &&
      typeof systemInstructions.instructions[key] === "function"
    ) {
      return systemInstructions.instructions[key](options);
    } else if (systemInstructions.instructions[key]) {
      return systemInstructions.instructions[key];
    } else {
      console.warn(
        `Invalid instruction key: ${key}. Using default instructions.`
      );
      return systemInstructions.instructions.default;
    }
  },

  // Optional: Allow modifying instructions at runtime
  setInstructions: (key, newInstruction) => {
    systemInstructions.instructions[key] = newInstruction;
  },
};

module.exports = systemInstructions;