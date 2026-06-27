const API_URL = 'http://localhost:5000/api';

let currentChatId = null;
let chats = [];
let messages = [];
let editingMessageId = null;

const chatsList = document.getElementById('chatsList');
const chatHeader = document.getElementById('chatHeader');
const chatName = document.getElementById('chatName');
const chatDescription = document.getElementById('chatDescription');
const messagesContainer = document.getElementById('messagesContainer');
const inputArea = document.getElementById('inputArea');
const emptyState = document.getElementById('emptyState');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const deleteChatBtn = document.getElementById('deleteChatBtn');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');

const chatModal = document.getElementById('chatModal');
const editModal = document.getElementById('editModal');
const chatForm = document.getElementById('chatForm');
const editForm = document.getElementById('editForm');
const chatNameInput = document.getElementById('chatNameInput');
const chatDescInput = document.getElementById('chatDescInput');
const editContent = document.getElementById('editContent');
const editTimestamp = document.getElementById('editTimestamp');

const showModal = (modal) => modal.classList.add('active');
const hideModal = (modal) => modal.classList.remove('active');

const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const fetchChats = async () => {
    try {
        const response = await fetch(`${API_URL}/chats`);
        chats = await response.json();
        renderChatsList();
    } catch (error) {
        console.error('Error:', error);
    }
};

const fetchMessages = async (chatId) => {
    try {
        const response = await fetch(`${API_URL}/messages/chat/${chatId}`);
        messages = await response.json();
        renderMessages();
    } catch (error) {
        console.error('Error:', error);
    }
};

const createChat = async (name, description) => {
    try {
        const response = await fetch(`${API_URL}/chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        });
        const newChat = await response.json();
        chats.push(newChat);
        renderChatsList();
        selectChat(newChat.id);
        hideModal(chatModal);
        chatForm.reset();
    } catch (error) {
        alert('Error creating chat');
    }
};

const deleteChat = async (chatId) => {
    if (!confirm('Delete this chat?')) return;
    try {
        await fetch(`${API_URL}/chats/${chatId}`, { method: 'DELETE' });
        chats = chats.filter(c => c.id !== chatId);
        renderChatsList();
        currentChatId = null;
        messages = [];
        chatHeader.style.display = 'none';
        inputArea.style.display = 'none';
        emptyState.style.display = 'flex';
    } catch (error) {
        alert('Error deleting chat');
    }
};

const sendMessage = async (content, file = null) => {
    if (!currentChatId) return;
    if (!content.trim() && !file) return;

    try {
        let response;
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('content', content || file.name);
            response = await fetch(`${API_URL}/messages/upload/${currentChatId}`, {
                method: 'POST',
                body: formData
            });
        } else {
            response = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId: currentChatId, content })
            });
        }
        const message = await response.json();
        messages.push(message);
        renderMessages();
        messageInput.value = '';
    } catch (error) {
        alert('Error sending message');
    }
};

const updateMessage = async (messageId, content) => {
    try {
        const response = await fetch(`${API_URL}/messages/${messageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        const updated = await response.json();
        const index = messages.findIndex(m => m.id === messageId);
        if (index !== -1) messages[index] = updated;
        renderMessages();
    } catch (error) {
        alert('Error updating');
    }
};

const updateMessageTimestamp = async (messageId, timestamp) => {
    try {
        await fetch(`${API_URL}/messages/${messageId}/timestamp`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timestamp })
        });
        const msg = messages.find(m => m.id === messageId);
        if (msg) msg.timestamp = new Date(timestamp).toISOString();
        renderMessages();
    } catch (error) {
        alert('Error updating time');
    }
};

const deleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    try {
        await fetch(`${API_URL}/messages/${messageId}`, { method: 'DELETE' });
        messages = messages.filter(m => m.id !== messageId);
        renderMessages();
    } catch (error) {
        alert('Error deleting');
    }
};

const renderChatsList = () => {
    chatsList.innerHTML = '';
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.innerHTML = `<strong>${chat.name}</strong><br><small>${chat.description || ''}</small>`;
        chatItem.addEventListener('click', () => selectChat(chat.id));
        chatsList.appendChild(chatItem);
    });
};

const renderMessages = () => {
    messagesContainer.innerHTML = '';
    messages.forEach((msg) => {
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        
        let mediaHTML = '';
        if (msg.mediaUrl) {
            if (msg.type === 'image') {
                mediaHTML = `<div class="message-media"><img src="${msg.mediaUrl}" alt="Image"></div>`;
            } else if (msg.type === 'video') {
                mediaHTML = `<div class="message-media"><video controls style="width:250px;"><source src="${msg.mediaUrl}"></video></div>`;
            } else if (msg.type === 'audio') {
                mediaHTML = `<div class="message-media"><audio controls style="width:250px;"><source src="${msg.mediaUrl}"></audio></div>`;
            } else {
                mediaHTML = `<div class="message-media"><a href="${msg.mediaUrl}" target="_blank">📎 ${msg.metadata.originalName}</a></div>`;
            }
        }

        messageEl.innerHTML = `
            <div class="message-content">
                <div class="message-text">${msg.content}</div>
                ${mediaHTML}
                <div class="message-meta">
                    <span class="timestamp" data-id="${msg.id}" data-ts="${msg.timestamp}">${formatDate(msg.timestamp)}</span>
                    ${msg.edited ? '<span>(edited)</span>' : ''}
                </div>
                <div class="message-actions">
                    <button class="btn-icon edit-btn" data-id="${msg.id}">✏️</button>
                    <button class="btn-icon delete-btn" data-id="${msg.id}">🗑️</button>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageEl);
    });

    document.querySelectorAll('.timestamp').forEach(el => {
        el.addEventListener('click', (e) => {
            editingMessageId = e.target.dataset.id;
            const msg = messages.find(m => m.id === editingMessageId);
            const date = new Date(msg.timestamp);
            editTimestamp.value = date.toISOString().slice(0, 16);
            editContent.value = msg.content;
            showModal(editModal);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            editingMessageId = e.target.dataset.id;
            const msg = messages.find(m => m.id === editingMessageId);
            editContent.value = msg.content;
            const date = new Date(msg.timestamp);
            editTimestamp.value = date.toISOString().slice(0, 16);
            showModal(editModal);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deleteMessage(e.target.dataset.id);
        });
    });
};

const selectChat = (chatId) => {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    chatName.textContent = chat.name;
    chatDescription.textContent = chat.description || 'No description';
    chatHeader.style.display = 'flex';
    inputArea.style.display = 'flex';
    emptyState.style.display = 'none';
    renderChatsList();
    fetchMessages(chatId);
};

newChatBtn.addEventListener('click', () => {
    chatNameInput.value = '';
    chatDescInput.value = '';
    showModal(chatModal);
});

deleteChatBtn.addEventListener('click', () => deleteChat(currentChatId));
sendBtn.addEventListener('click', () => sendMessage(messageInput.value));
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(messageInput.value);
    }
});

attachBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        sendMessage('', e.target.files[0]);
        fileInput.value = '';
    }
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    createChat(chatNameInput.value.trim(), chatDescInput.value.trim());
});

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    updateMessageTimestamp(editingMessageId, editTimestamp.value);
    updateMessage(editingMessageId, editContent.value);
    hideModal(editModal);
});

document.getElementById('closeModalBtn').addEventListener('click', () => hideModal(chatModal));
document.getElementById('cancelModalBtn').addEventListener('click', () => hideModal(chatModal));
document.getElementById('closeEditModalBtn').addEventListener('click', () => hideModal(editModal));
document.getElementById('cancelEditBtn').addEventListener('click', () => hideModal(editModal));

chatModal.addEventListener('click', (e) => {
    if (e.target === chatModal) hideModal(chatModal);
});

editModal.addEventListener('click', (e) => {
    if (e.target === editModal) hideModal(editModal);
});

document.addEventListener('DOMContentLoaded', () => {
    fetchChats();
});
