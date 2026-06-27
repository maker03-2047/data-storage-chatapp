const express = require('express');
const router = express.Router();
const storage = require('../models/storage');

router.get('/', (req, res) => {
  try {
    const chats = storage.getAllChats();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:chatId', (req, res) => {
  try {
    const chat = storage.getChatById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Chat name is required' });
    const newChat = storage.createChat(name, description || '');
    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:chatId', (req, res) => {
  try {
    const { name, description } = req.body;
    const chat = storage.updateChat(req.params.chatId, name, description);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:chatId', (req, res) => {
  try {
    storage.deleteChat(req.params.chatId);
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
