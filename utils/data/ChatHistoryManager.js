// FILE: utils/ChatHistoryManager.js
const {
    ERROR_CODES,
    MESSAGE_ROLES,
    MESSAGE_TYPES,
  } = require('../../config/constants');
  const { findChatById, addMessageToChat } = require('./chatRepository');
  
  class ChatHistoryManager {
    constructor(chatId, chatRepository) {
      this.chatId = chatId;
      this.chatRepository = chatRepository;
    }
  
    getChatId() {
      return this.chatId;
    }
  
    async getMessages() {
      try {
        const chat = await this.chatRepository.findChatById(this.chatId);
        if (!chat) {
          throw new Error('Chat not found');
        }
        return chat.messages;
      } catch (error) {
        console.error('Error fetching messages:', error);
        throw new Error(ERROR_CODES.DATABASE_ERROR);
      }
    }
  
    async buildHistory() {
        const messages = await this.getMessages();
        const filteredMessages = messages.length > 1 && messages[messages.length - 1].role === MESSAGE_ROLES.USER
            ? messages.slice(0, -1)
            : messages;
    
        return filteredMessages.map((message) => ({
            role: message.role === MESSAGE_ROLES.USER ? 'user' : 'model',
            parts: [{ text: message.text }],
        }));
    }
  
    async addMessage(message, role, position = null) {
      const messages = await this.getMessages();
  
      // Validate first message
      if (messages.length === 0 && role !== MESSAGE_ROLES.USER) {
        throw new Error('The first message must be from the user.');
      }
  
      // Validate position
      if (position !== null && (position < 0 || position > messages.length)) {
        throw new Error('Invalid message position.');
      }
  
      // Validate role for position 0
      if (position === 0 && role === MESSAGE_ROLES.BOT) {
        throw new Error('Cannot add a bot message at the beginning.');
      }
  
      // Validate consecutive roles
      if (position !== null && position > 0) {
          const prevMessage = messages[position - 1];
          if (prevMessage.role === role) {
            throw new Error('Cannot add two consecutive messages with the same role.');
          }
        }
    
        if (position !== null && position < messages.length) {
          const nextMessage = messages[position];
          if (nextMessage.role === role) {
            throw new Error('Cannot add two consecutive messages with the same role.');
          }
        }
  
      const newMessage = {
        text: message,
        messageType: MESSAGE_TYPES.TEXT, // Assuming text for now, you can modify this
        role: role,
        createdAt: new Date(),
      };
  
      if (position === null) {
        // Append to the end
        messages.push(newMessage);
      } else {
        // Insert at the specified position
        messages.splice(position, 0, newMessage);
      }
  
      // Update the chat in the database
      const updatedChat = await this.chatRepository.updateChat(this.chatId, {
        messages: messages,
        updatedAt: new Date(),
      });
  
      return updatedChat;
    }
  
    async removeMessage(position) {
      const messages = await this.getMessages();
  
      // Validate position
      if (position < 0 || position >= messages.length) {
        throw new Error('Invalid message position.');
      }
  
      messages.splice(position, 1);
  
      // Update the chat in the database
      const updatedChat = await this.chatRepository.updateChat(this.chatId, {
        messages: messages,
        updatedAt: new Date(),
      });
  
      return updatedChat;
    }
  
    async getLastMessage() {
      const messages = await this.getMessages();
      return messages.length > 0 ? messages[messages.length - 1] : null;
    }
  
    async getMessagesByRole(role) {
      const messages = await this.getMessages();
      return messages.filter((message) => message.role === role);
    }
  
    async replaceMessage(position, newMessage, newRole) {
      const messages = await this.getMessages();
  
      // Validate position
      if (position < 0 || position >= messages.length) {
        throw new Error('Invalid message position.');
      }
  
      messages[position] = {
        text: newMessage,
        messageType: MESSAGE_TYPES.TEXT, // Assuming text for now
        role: newRole,
        createdAt: new Date(), // You might want to preserve the original timestamp
      };
  
      // Update the chat in the database
      const updatedChat = await this.chatRepository.updateChat(this.chatId, {
        messages: messages,
        updatedAt: new Date(),
      });
  
      return updatedChat;
    }
  
    async clearHistory() {
      // Add confirmation or safety checks here if needed
  
      // Update the chat in the database with an empty message array
      const updatedChat = await this.chatRepository.updateChat(this.chatId, {
        messages: [],
        updatedAt: new Date(),
      });
  
      return updatedChat;
    }
  
    async appendCurrentMessage(message, role) {
      return this.addMessage(message, role, null);
    }
  }
  
  module.exports = ChatHistoryManager;