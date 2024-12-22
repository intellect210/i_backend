const { ERROR_CODES, MESSAGE_TYPES, MESSAGE_ROLES } = require('../config/constants');
const logger = require('../utils/logger');
const {
  createChat,
  findChatById,
  addMessageToChat,
  replaceLastMessageInChat,
} = require('../utils/data/chatRepository');
const { isEmptyMessage, isConsecutiveUserMessage } = require('../utils/data/validators');
const { BOT_RESPONSE_TIMEOUT_MS } = require('../config/constants');
const websocketConnectionManager = require('../utils/websocketConnectionManager');
const chatTitleService = require('./chatTitleService');

const messageService = {
  storeMessage: async (userId, message, messageType, role, chatId = null) => {
    console.log('storeMessage called with:', {
      userId,
      message,
      messageType,
      role,
      chatId,
    });

    try {
      let chat;
      if (chatId) {
        console.log('Searching for chat by ID:', chatId);
        chat = await findChatById(chatId);
        // console.log('Chat found by ID:', chat);
      }

      if (!chat) {
        console.log('No chat found by ID, creating a new chat');
        chat = await createChat(userId, {
          text: message,
          messageType: messageType,
          role: role,
          createdAt: new Date(),
        });
        console.log('New chat created:', chat);

        // Set chat title for new chat
        await chatTitleService.setChatTitle(chat._id, userId, message);

        return {
          chat,
          message: 'New chat created and message stored successfully',
        };
      } else {
        // Check and set chat title if not already set
        if (!chat.chatname || chat.chatname.trim() === '') {
          await chatTitleService.setChatTitle(chat._id, userId, message);
        }

        if (isEmptyMessage(message)) {
          console.log('Message is empty');
          throw new Error(ERROR_CODES.EMPTY_MESSAGE);
        }

        if (isConsecutiveUserMessage(chat, role)) {
          console.log(
            'Consecutive user message detected for chatId:',
            chatId
          );
          throw new Error(ERROR_CODES.CONSECUTIVE_USER_MESSAGE);
        }

        const newMessage = {
          text: message,
          messageType: messageType,
          role: role,
          createdAt: new Date(),
        };
        console.log('Adding message to chat:', newMessage);
        const updatedChat = await addMessageToChat(chat._id, newMessage);
        console.log('Message added to chat successfully');
        return { chat: updatedChat, message: 'Message stored successfully' };
      }
    } catch (error) {
      console.error('Error in storeMessage:', error);
      logger.error('Error storing message:', error);

      let errorCode = ERROR_CODES.DATABASE_ERROR;
      let errorMessage = 'An error occurred while storing the message.';

      if (error.message === ERROR_CODES.EMPTY_MESSAGE) {
        errorCode = ERROR_CODES.EMPTY_MESSAGE;
        errorMessage = 'Message cannot be empty.';
      } else if (error.message === ERROR_CODES.CONSECUTIVE_USER_MESSAGE) {
        errorCode = ERROR_CODES.CONSECUTIVE_USER_MESSAGE;
        errorMessage = 'Please wait for the bot to respond.';
      }

      throw {
        code: errorCode,
        message: errorMessage,
      };
    }
  },

  getChatHistory: async (user) => {
    console.log('getChatHistory called with user:', user);
    // implement it later when needed
  },

  handleBotResponseTimeout: (userId) => {
    const timeoutId = setTimeout(() => {
      // Check if a bot response was sent in the meantime.
      const userConnections = websocketConnectionManager.getConnection(userId);
      if (userConnections) {
        for (const [socketId, ws] of userConnections.entries()) {
          if (ws.readyState === ws.OPEN) {
            ws.send(
              JSON.stringify({
                type: MESSAGE_TYPES.TEXT,
                role: MESSAGE_ROLES.BOT,
                message:
                  "I'm sorry, I seem to be having trouble responding right now. Please try again later.",
                code: ERROR_CODES.BOT_RESPONSE_TIMEOUT,
              })
            );
            console.log(
              `Sent timeout message to user ${userId} on socket ${socketId}`
            );
          }
        }
      }
    }, BOT_RESPONSE_TIMEOUT_MS);
    setTimeout(() => {
      clearTimeout(timeoutId);
    }, BOT_RESPONSE_TIMEOUT_MS + 5000);
    return timeoutId;
  },
};

module.exports = messageService;