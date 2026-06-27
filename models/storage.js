const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const chatsFile = path.join(DATA_DIR, 'chats.json');
const messagesFile = path.join(DATA_DIR, 'messages.json');

const initializeFiles = () => {
  if (!fs.existsSync(chatsFile)) {
    fs.writeFileSync(chatsFile, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(messagesFile)) {
    fs.writeFileSync(messagesFile, JSON.stringify([], null, 2));
  }
};

initializeFiles();

const getAllChats = () => {
  const data = fs.readFileSync(chatsFile, 'utf-8');
  return JSON.parse(data);
};

const getChatById = (chatId) => {
  const chats = getAllChats();
  return chats.find(chat => chat.id === chatId);
};

const createChat = (name, description = '') => {
  const chats = getAllChats();
  const newChat = {
    id: uuidv4(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  chats.push(newChat);
  fs.writeFileSync(chatsFile, JSON.stringify(chats, null, 2));
  return newChat;
};

const updateChat = (chatId, name, description) => {
  const chats = getAllChats();
  const chat = chats.find(c => c.id === chatId);
  if (chat) {
    chat.name = name;
    chat.description = description;
    chat.updatedAt = new Date().toISOString();
    fs.writeFileSync(chatsFile, JSON.stringify(chats, null, 2));
  }
  return chat;
};

const deleteChat = (chatId) => {
  const chats = getAllChats();
  const filtered = chats.filter(c => c.id !== chatId);
  fs.writeFileSync(chatsFile, JSON.stringify(filtered, null, 2));
  
  const messages = getAllMessages();
  const filteredMessages = messages.filter(m => m.chatId !== chatId);
  fs.writeFileSync(messagesFile, JSON.stringify(filteredMessages, null, 2));
};

const getAllMessages = () => {
  const data = fs.readFileSync(messagesFile, 'utf-8');
  return JSON.parse(data);
};

const getMessagesByChat = (chatId) => {
  const messages = getAllMessages();
  return messages.filter(msg => msg.chatId === chatId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

const createMessage = (chatId, content, type = 'text', mediaUrl = null, metadata = {}) => {
  const messages = getAllMessages();
  const newMessage = {
    id: uuidv4(),
    chatId,
    content,
    type,
    mediaUrl,
    metadata,
    timestamp: new Date().toISOString(),
    edited: false,
    editedAt: null
  };
  messages.push(newMessage);
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
  return newMessage;
};

const updateMessage = (messageId, content) => {
  const messages = getAllMessages();
  const message = messages.find(m => m.id === messageId);
  if (message) {
    message.content = content;
    message.edited = true;
    message.editedAt = new Date().toISOString();
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
  }
  return message;
};

const updateMessageTimestamp = (messageId, timestamp) => {
  const messages = getAllMessages();
  const message = messages.find(m => m.id === messageId);
  if (message) {
    message.timestamp = new Date(timestamp).toISOString();
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
  }
  return message;
};

const deleteMessage = (messageId) => {
  const messages = getAllMessages();
  const filtered = messages.filter(m => m.id !== messageId);
  fs.writeFileSync(messagesFile, JSON.stringify(filtered, null, 2));
};

module.exports = {
  getAllChats, getChatById, createChat, updateChat, deleteChat,
  getAllMessages, getMessagesByChat, createMessage, updateMessage,
  updateMessageTimestamp, deleteMessage
};
