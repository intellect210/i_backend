const Chat = require('../models/chatModel');
const { findChatById } = require('../utils/data/chatRepository');
const { handleDatabaseError } = require('../utils/errorHandlers');

const chatController = {
  getAllChats: async (req, res) => {
    try {
        const useruid  = req.user.useruid; // Assuming user ID is in req.user after authMiddleware
      console.log('Fetching all chats for user:', useruid);
      const chats = await Chat.find({ userId: useruid });
      console.log('Chats found:', chats);
      res.status(200).json(chats);
    } catch (error) {
        handleDatabaseError(error, null, null, req.user.useruid);
      res.status(500).json({ message: 'Error fetching chats', error: error.message });
    }
  },
};

module.exports = chatController;