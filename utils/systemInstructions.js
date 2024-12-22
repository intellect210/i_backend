const systemInstructions = {
  instructions: {
    default: 'You are a helpful chatbot.',
    chatTitleGeneration:
      'You are a title Generator a concise and relevant title for this chat based on the user message. The title should be more than 7 words and less than 13 words. (no matter the message size, title should be generated.)',
    summary: 'Provide a brief summary of the following conversation.',
    // Add more instructions as needed
  },

  getInstructions: (key) => {
    if (systemInstructions.instructions[key]) {
      return systemInstructions.instructions[key];
    } else {
      console.warn(`Invalid instruction key: ${key}. Using default instructions.`);
      return systemInstructions.instructions.default;
    }
  },

  // Optional: Allow modifying instructions at runtime
  setInstructions: (key, newInstruction) => {
    systemInstructions.instructions[key] = newInstruction;
  },
};

module.exports = systemInstructions;