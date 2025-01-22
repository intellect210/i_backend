const Chat = require('../models/chatModel');
const { handleDatabaseError } = require('../utils/errorHandlers');

const messageController = {
  getAllMessages: async (req, res) => {
    try {
      const { chatId, useruid } = req.params;
      console.log(`Fetching all messages for chat ${chatId} and user ${useruid}`);

      const chat = await Chat.findOne({
        _id: chatId,
        userId: useruid,
      });


      if (!chat) {
        console.log(`Chat with ID ${chatId} not found for user ${useruid}`);
        return res.status(404).json({ message: 'Chat not found' });
      }
        const transformedMessages = chat.messages.map(msg => ({
            messageId: msg.messageId.toString(),
            message: msg.text,
            messageType: msg.messageType,
            role: msg.role,
            timestamp: msg.createdAt,
            tempId: null,
            isPending: false,
      }));
        
      console.log(`Found ${chat.messages.length} messages for chat ${chatId}`);
      res.status(200).json(transformedMessages);


    } catch (error) {
      handleDatabaseError(error, null, null, req.user.useruid);
      res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
  },
};

module.exports = messageController;