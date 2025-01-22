const Chat = require('../../models/chatModel');

const chatRepository = {
  createChat: async (userId, firstMessage) => {
    const newChat = new Chat({
      userId,
      messages: [firstMessage],
    });
    await newChat.save();
    return newChat;
  },

  findChatById: async (chatId) => {
    return await Chat.findById(chatId);
  },

  updateChat: async (chatId, updateData) => {
    return await Chat.findByIdAndUpdate(chatId, updateData, { new: true });
  },

  addMessageToChat: async (chatId, message) => {
    const chat = await Chat.findById(chatId);
    chat.messages.push(message);
    chat.updatedAt = Date.now();
    await chat.save();
    return chat;
  },

  replaceLastMessageInChat: async (chatId, newMessage) => {
    const chat = await Chat.findById(chatId);
    if (chat.messages.length > 0) {
      chat.messages.pop(); // Remove the last message
      chat.messages.push(newMessage);
      chat.updatedAt = Date.now();
      await chat.save();
    }
    return chat;
  },

  updateChatTitle: async (chatId, newTitle) => {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatname: newTitle },
      { new: true }
    );
    if (!updatedChat) {
      throw new Error(`Failed to update chat title for chat ID: ${chatId}`);
    }
    return updatedChat;
  },
};

module.exports = chatRepository;