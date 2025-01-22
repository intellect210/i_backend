const chatRepository = require('../utils/respositories/chatRepository');
const botController = require('../controllers/controller-bot');
const logger = require('../utils/helpers/logger');

const chatTitleService = {
  setChatTitle: async (chatId, userId, newTitle = null) => {
    try {
      const chat = await chatRepository.findChatById(chatId);

      if (!chat) {
        logger.error(`Chat not found: ${chatId}`);
        return; // Or throw an error if that's more appropriate
      }

      if (chat.chatname && chat.chatname.trim() !== '') {
        logger.info(`Chat title already set for chat: ${chatId}`);
        return; // Title already set
      }

      // let generatedTitle;
      // if (!newTitle) {
      //   generatedTitle = await botController.sendMessageWithInstructions(
      //     'Please generate a title for this chat.',
      //     'chatTitleGeneration'
      //   );
      // } else {
      //   generatedTitle = await botController.sendMessageWithInstructions(
      //     newTitle,
      //     'chatTitleGeneration'
      //   );
      // }

      // if (!generatedTitle) {
      //   logger.warn(
      //     `Failed to generate chat title for chat: ${chatId}. Using default title.`
      //   );
      //   generatedTitle = `Chat with User ${userId}`;
      // }

      // console.log(`Generated chat title: ${generatedTitle}`);

      // // Sanitize the generated title (e.g., remove extra quotes, limit length)
      // generatedTitle = generatedTitle.replace(/["']/g, '').substring(0, 100); // Example sanitization

      await chatRepository.updateChatTitle(chatId, "temporary chats");
      logger.info(`Chat title updated for chat: ${chatId}`);
    } catch (error) {
      logger.error(`Error setting chat title for chat: ${chatId}`, error);
      // You might want to handle the error differently, e.g.,
      // - Throw the error to be handled by the caller
      // - Set a default title in the database even if the update fails
    }
  },
};

module.exports = chatTitleService;