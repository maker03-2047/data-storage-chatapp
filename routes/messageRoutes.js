const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const storage = require('../models/storage');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 }
});

router.get('/chat/:chatId', (req, res) => {
  try {
    const messages = storage.getMessagesByChat(req.params.chatId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { chatId, content } = req.body;
    if (!chatId || !content) return res.status(400).json({ error: 'Required fields missing' });
    const message = storage.createMessage(chatId, content, 'text');
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload/:chatId', upload.single('file'), (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type } = req.body;
    
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const mediaUrl = `/uploads/${req.file.filename}`;
    const metadata = {
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    };

    const message = storage.createMessage(chatId, content || req.file.originalname, type || 'file', mediaUrl, metadata);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:messageId', (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });
    const message = storage.updateMessage(req.params.messageId, content);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:messageId/timestamp', (req, res) => {
  try {
    const { timestamp } = req.body;
    if (!timestamp) return res.status(400).json({ error: 'Timestamp is required' });
    const message = storage.updateMessageTimestamp(req.params.messageId, timestamp);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:messageId', (req, res) => {
  try {
    storage.deleteMessage(req.params.messageId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
