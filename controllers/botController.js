// FILE: controllers/botController.js
const botController = {
    handleBotResponse: (message) => {
      // Simple echo for now
      return message.message;
    },
  };
  
  module.exports = botController;