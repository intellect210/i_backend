const Chat = require('../models/chatModel');
const { findChatById } = require('../utils/respositories/chatRepository');
const { handleDatabaseError } = require('../utils/helpers/error-handlers');

const chatController = {
  getAllChats: async (req, res) => {
    try {
      const useruid = req.user.useruid; // Assuming user ID is in req.user after authMiddleware
      console.log('Fetching all chats for user:', useruid);
      const chats = await Chat.find({ userId: useruid }).select('-messages');
      // console.log('Chats found:', chats);
      res.status(200).json(chats);
    } catch (error) {
      handleDatabaseError(error, null, null, req.user.useruid);
      res.status(500).json({ message: 'Error fetching chats', error: error.message });
    }
  },

  deleteChat: async (req, res) => {
    try {
      const chatId = req.params.chatId; // Assuming chat ID is in req.params after rout
      console.log('Deleting chat:', chatId);
      const chat = await findChatById(chatId);
      if (!chat) {
        console.log('Chat not found:', chatId);
        return res.status(404).json({ message: 'Chat not found' });
      }
      await chat.deleteOne({ chatId: chatId });
      console.log('Chat deleted:', chat);
      res.status(200).json({ message: 'Chat deleted' });
    } catch (error) {
      handleDatabaseError(error, null, null, req.user.useruid);
      res.status(500).json({ message: 'Error deleting chat', error: error.message });
    }
  },
};

module.exports = chatController;