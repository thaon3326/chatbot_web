class ChatbotApp {
    constructor() {
        this.currentSessionId = null;
        this.currentRatingConversationId = null;
        this.apiBase = '/api';
        this.authToken = null;
        this.currentUser = null;
        
        this.checkAuthentication();
    }

    async checkAuthentication() {
        const token = localStorage.getItem('access_token');
        const userInfo = localStorage.getItem('user_info');

        if (!token || !userInfo) {
            this.redirectToAuth();
            return;
        }

        try {
            // Verify token
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.authToken = token;
                this.currentUser = JSON.parse(userInfo);
                this.initializeApp();
            } else {
                this.redirectToAuth();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.redirectToAuth();
        }
    }

    redirectToAuth() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        window.location.href = '/auth';
    }

    initializeApp() {
        this.initializeElements();
        this.bindEvents();
        this.updateUserInfo();
        this.initializeSession();
        this.checkServerStatus();
        this.loadSessions(); // <-- Thêm dòng này để luôn load lịch sử khi vào trang
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.historyBtn = document.getElementById('historyBtn');
        this.sidebar = document.getElementById('sidebar');
        this.closeSidebar = document.getElementById('closeSidebar');
        this.sessionList = document.getElementById('sessionList');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.ratingModal = document.getElementById('ratingModal');
        this.closeRatingModal = document.getElementById('closeRatingModal');
        this.submitRating = document.getElementById('submitRating');
        this.cancelRating = document.getElementById('cancelRating');
        this.feedbackText = document.getElementById('feedbackText');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userName = document.getElementById('userName');
    }

    updateUserInfo() {
        if (this.currentUser) {
            const displayName = this.currentUser.full_name || this.currentUser.username;
            this.userName.textContent = `Xin chào, ${displayName}!`;
        }
    }

    bindEvents() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.newChatBtn.addEventListener('click', () => this.createNewSession());
        // this.historyBtn.addEventListener('click', () => this.toggleSidebar());
        // this.closeSidebar.addEventListener('click', () => this.toggleSidebar());
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        // Modal events
        this.closeRatingModal.addEventListener('click', () => this.closeRatingModalFunc());
        this.cancelRating.addEventListener('click', () => this.closeRatingModalFunc());
        this.submitRating.addEventListener('click', () => this.submitRatingFunc());
        
        // Rating stars
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => this.selectRating(e));
            star.addEventListener('mouseover', (e) => this.hoverRating(e));
        });
        
        document.querySelector('.rating-stars').addEventListener('mouseleave', () => this.resetRatingHover());
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
    }

    async initializeSession() {
        try {
            const response = await fetch(`${this.apiBase}/new-session`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            this.currentSessionId = data.session_id;
        } catch (error) {
            console.error('Error creating session:', error);
            this.showError('Không thể tạo phiên làm việc mới');
        }
    }

    async checkServerStatus() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            const data = await response.json();
            
            if (data.ollama_connected) {
                this.statusIndicator.className = 'status-indicator online';
                this.statusText.textContent = 'Đã kết nối';
            } else {
                this.statusIndicator.className = 'status-indicator offline';
                this.statusText.textContent = 'Ollama không khả dụng';
            }
        } catch (error) {
            this.statusIndicator.className = 'status-indicator offline';
            this.statusText.textContent = 'Mất kết nối';
        }
    }

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        window.location.href = '/auth';
    }

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
        };
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.sendBtn.disabled = true;

        // Hiển thị tin nhắn người dùng
        this.addMessage(message, 'user');

        // Hiển thị typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch(`${this.apiBase}/chat`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    message: message,
                    session_id: this.currentSessionId
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.hideTypingIndicator();
                this.addMessage(data.response, 'bot', true, data.conversation_id);
            } else {
                this.hideTypingIndicator();
                this.showError(data.detail || 'Có lỗi xảy ra');
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.showError('Không thể kết nối với server');
        } finally {
            this.sendBtn.disabled = false;
            this.messageInput.focus();
        }
    }

    addMessage(content, type, showActions = false, conversationId = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        // Lưu conversation_id vào data attribute
        if (conversationId) {
            messageDiv.setAttribute('data-conversation-id', conversationId);
        }

        const avatar = document.createElement('div');
        avatar.className = `message-avatar ${type}-avatar`;
        avatar.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = `
            <p>${this.formatMessage(content)}</p>
            <div class="message-timestamp">${new Date().toLocaleTimeString('vi-VN')}</div>
            ${showActions ? `
                <div class="message-actions">
                    <button class="action-btn rate-btn" onclick="chatApp.openRatingModal(this)">
                        <i class="fas fa-star"></i> Đánh giá
                    </button>
                </div>
            ` : ''}
        `;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(message) {
        // Chuyển đổi line breaks thành <br>
        return message.replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';

        typingDiv.innerHTML = `
            <div class="message-avatar bot-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async createNewSession() {
        try {
            this.showLoading();
            const response = await fetch(`${this.apiBase}/new-session`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            
            this.currentSessionId = data.session_id;
            this.clearChat();
            this.hideLoading();
            this.showSuccess('Đã tạo cuộc hội thoại mới');
        } catch (error) {
            this.hideLoading();
            this.showError('Không thể tạo cuộc hội thoại mới');
        }
    }

    clearChat() {
        this.chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="bot-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>Xin chào! Tôi là trợ lý AI của bạn. Hãy hỏi tôi bất cứ điều gì bằng tiếng Việt!</p>
                </div>
            </div>
        `;
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('open');
        if (this.sidebar.classList.contains('open')) {
            this.loadSessions();
        }
    }

    // async loadSessions() {
    //     try {
    //         const response = await fetch(`${this.apiBase}/sessions`, {
    //             headers: this.getAuthHeaders()
    //         });
    //         const data = await response.json();
            
    //         this.sessionList.innerHTML = '';
            
    //         if (data.sessions.length === 0) {
    //             this.sessionList.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 2rem;">Chưa có cuộc hội thoại nào</p>';
    //             return;
    //         }

    //         for (const sessionId of data.sessions) {
    //             await this.addSessionToList(sessionId);
    //         }
    //     } catch (error) {
    //         this.showError('Không thể tải lịch sử cuộc hội thoại');
    //     }
    // }

    // ...trong class ChatbotApp...

    async loadSessions() {
        try {
            const response = await fetch(`${this.apiBase}/sessions`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();

            this.sessionList.innerHTML = '';

            if (!data.sessions || data.sessions.length === 0) {
                this.sessionList.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 2rem;">Chưa có cuộc hội thoại nào</p>';
                return;
            }

            // Lọc trùng session_id, chỉ giữ lại 1 session cho mỗi id
            const uniqueSessionsMap = {};
            for (const session of data.sessions) {
                if (!uniqueSessionsMap[session.session_id]) {
                    uniqueSessionsMap[session.session_id] = session;
                }
            }
            const uniqueSessions = Object.values(uniqueSessionsMap);

            for (const session of uniqueSessions) {
                const sessionDiv = document.createElement('div');
                sessionDiv.className = `session-item${session.session_id === this.currentSessionId ? ' active' : ''}`;
                sessionDiv.innerHTML = `
                    <!-- <div class="session-id">Session: ${session.session_id.substring(0, 8)}...</div> -->
                    <div class="fw-bold session-preview">${session.first_message || ''}</div>
                    <div class="session-time">${session.created_at ? this.formatTimestamp(session.created_at) : ''}</div>
                `;
                sessionDiv.addEventListener('click', () => this.loadSession(session.session_id));
                this.sessionList.appendChild(sessionDiv);
            }
        } catch (error) {
            this.showError('Không thể tải lịch sử cuộc hội thoại');
        }
    }
    async addSessionToList(sessionId) {
        try {
            const response = await fetch(`${this.apiBase}/history/${sessionId}`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.history.length > 0) {
                const firstMessage = data.history[0].user_message;
                const preview = firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
                
                const sessionDiv = document.createElement('div');
                sessionDiv.className = `session-item ${sessionId === this.currentSessionId ? 'active' : ''}`;
                sessionDiv.innerHTML = `
                    <div class="session-id">Session: ${sessionId.substring(0, 8)}...</div>
                    <div class="session-preview">${preview}</div>
                `;
                
                sessionDiv.addEventListener('click', () => this.loadSession(sessionId));
                this.sessionList.appendChild(sessionDiv);
            }
        } catch (error) {
            console.error('Error loading session:', error);
        }
    }

    async loadSession(sessionId) {
        try {
            this.showLoading();
            const response = await fetch(`${this.apiBase}/history/${sessionId}`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            
            this.currentSessionId = sessionId;
            this.clearChat();
            
            for (const conv of data.history) {
                this.addMessage(conv.user_message, 'user');
                this.addMessage(conv.bot_response, 'bot', true, conv.id);
            }
            
            // this.toggleSidebar();
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            this.showError('Không thể tải cuộc hội thoại');
        }
    }

    openRatingModal(button) {
        // Lấy conversation ID từ data attribute
        const messageElement = button.closest('.message');
        const conversationId = messageElement.getAttribute('data-conversation-id');
        
        if (!conversationId) {
            this.showError('Không thể đánh giá tin nhắn này');
            return;
        }

        this.currentRatingConversationId = parseInt(conversationId);
        this.ratingModal.classList.add('show');
        this.resetRating();
    }

    closeRatingModalFunc() {
        this.ratingModal.classList.remove('show');
        this.resetRating();
    }

    selectRating(event) {
        const rating = parseInt(event.target.closest('.star').dataset.rating);
        this.setRatingStars(rating);
        this.selectedRating = rating;
    }

    hoverRating(event) {
        const rating = parseInt(event.target.closest('.star').dataset.rating);
        this.setRatingStars(rating);
    }

    resetRatingHover() {
        if (this.selectedRating) {
            this.setRatingStars(this.selectedRating);
        } else {
            this.setRatingStars(0);
        }
    }

    setRatingStars(rating) {
        document.querySelectorAll('.star').forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    resetRating() {
        this.selectedRating = 0;
        this.setRatingStars(0);
        this.feedbackText.value = '';
    }

    async submitRatingFunc() {
        if (!this.selectedRating) {
            this.showError('Vui lòng chọn số sao đánh giá');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/rate`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    conversation_id: this.currentRatingConversationId,
                    rating: this.selectedRating,
                    feedback: this.feedbackText.value || null
                })
            });

            if (response.ok) {
                this.closeRatingModalFunc();
                this.showSuccess('Cảm ơn bạn đã đánh giá!');
            } else {
                this.showError('Không thể lưu đánh giá');
            }
        } catch (error) {
            this.showError('Có lỗi xảy ra khi gửi đánh giá');
        }
    }

    showLoading() {
        this.loadingOverlay.classList.add('show');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('show');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `${type}-message`;
        notification.textContent = message;
        
        // Thêm vào đầu chat messages
        this.chatMessages.insertBefore(notification, this.chatMessages.firstChild);
        
        // Tự động xóa sau 3 giây
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Utility methods
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString('vi-VN');
    }

    // Auto-save draft message
    saveDraft() {
        localStorage.setItem('chatbot_draft', this.messageInput.value);
    }

    loadDraft() {
        const draft = localStorage.getItem('chatbot_draft');
        if (draft) {
            this.messageInput.value = draft;
            this.autoResizeTextarea();
        }
    }

    clearDraft() {
        localStorage.removeItem('chatbot_draft');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatbotApp();
});

// Auto-save draft every 2 seconds
setInterval(() => {
    if (window.chatApp && window.chatApp.messageInput.value) {
        window.chatApp.saveDraft();
    }
}, 2000);


// ...existing code...

async function fetchChatSessions() {
    try {
        const res = await fetch('/api/sessions', { credentials: 'include' });
        if (!res.ok) throw new Error('Không lấy được lịch sử');
        const data = await res.json();
        renderChatSessions(data.sessions);
    } catch (err) {
        document.getElementById('sessionList').innerHTML = '<p>Không thể tải lịch sử.</p>';
    }
}

function renderChatSessions(sessions) {
    const sessionList = document.getElementById('sessionList');
    if (!sessions || sessions.length === 0) {
        sessionList.innerHTML = '<p>Chưa có cuộc hội thoại nào.</p>';
        return;
    }
    sessionList.innerHTML = sessions.map(session => `
        <div class="session-item" data-session-id="${session.session_id}">
            <div class="session-title">${session.title || 'Cuộc hội thoại ' + session.session_id}</div>
            <div class="session-time">${new Date(session.created_at).toLocaleString('vi-VN')}</div>
        </div>
    `).join('');
}

// Khi nhấn nút "Lịch sử" hoặc mở sidebar
// document.getElementById('historyBtn').addEventListener('click', () => {
//     document.getElementById('sidebar').style.display = 'block';
//     fetchChatSessions();
// });

// Đóng sidebar
// document.getElementById('closeSidebar').addEventListener('click', () => {
//     document.getElementById('sidebar').style.display = 'none';
// });

// ...existing code...