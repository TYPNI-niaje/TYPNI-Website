/*!
 * Modern Chatbot for TYPNI
 * Mobile-first responsive chatbot with modern UI
 * Version: 2.0
 */

// Get Gemini API key
const GEMINI_API_KEY = 'AIzaSyBK08X0hbD0XtQipnxDz_vc09rcKsnbgFo';

class ModernChatbot {
    constructor() {
        this.messageHistory = [];
        this.isProcessing = false;
        this.isMinimized = true;
        this.initialize();
    }

    initialize() {
        // Create modern chatbot HTML
        const chatContainer = document.createElement('div');
        chatContainer.innerHTML = `
            <!-- Floating Action Button -->
            <button class="chatbot-fab" id="chatbot-fab">
                <i class="fas fa-comments"></i>
            </button>

            <!-- Modern Chatbot Interface -->
            <div class="modern-chatbot" id="modern-chatbot">
                <!-- Header -->
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <div class="chatbot-avatar">T</div>
                        <div>
                            <div class="chatbot-title">TYPNI Assistant</div>
                            <div class="chatbot-status">
                                <div class="status-dot"></div>
                                Online - Ready to help
                            </div>
                        </div>
                    </div>
                    <div class="chatbot-controls">
                        <button class="control-btn" id="minimize-btn" title="Minimize">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="control-btn" id="close-btn" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- Messages Area -->
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="message bot">
                        <div class="message-avatar">T</div>
                        <div class="message-content">
                            <div class="message-bubble">
                                Hello! 👋 Welcome to TYPNI. I'm here to help you learn about our youth programs, events, and opportunities. How can I assist you today?
                            </div>
                            <div class="message-time">${this.getCurrentTime()}</div>
                        </div>
                    </div>
                    <div class="quick-replies">
                        <div class="quick-reply" data-message="Tell me about youth programs">🎓 Youth Programs</div>
                        <div class="quick-reply" data-message="What events do you have?">📅 Upcoming Events</div>
                        <div class="quick-reply" data-message="How can I get involved?">🤝 Get Involved</div>
                        <div class="quick-reply" data-message="Contact information">📞 Contact Us</div>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="chatbot-input-area">
                    <div class="input-container">
                        <textarea 
                            class="chatbot-input" 
                            id="chatbot-input" 
                            placeholder="Type your message..."
                            rows="1"
                        ></textarea>
                        <button class="send-button" id="send-button" title="Send message">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add to body
        document.body.appendChild(chatContainer);

        // Initialize elements
        this.fab = document.getElementById('chatbot-fab');
        this.chatbot = document.getElementById('modern-chatbot');
        this.messagesContainer = document.getElementById('chatbot-messages');
        this.input = document.getElementById('chatbot-input');
        this.sendButton = document.getElementById('send-button');
        this.minimizeBtn = document.getElementById('minimize-btn');
        this.closeBtn = document.getElementById('close-btn');

        // Bind events
        this.bindEvents();

        // Show welcome notification after a delay
        setTimeout(() => {
            this.showNotification();
        }, 3000);
    }

    bindEvents() {
        // FAB click
        this.fab.addEventListener('click', () => {
            this.toggleChatbot();
        });

        // Control buttons
        this.minimizeBtn.addEventListener('click', () => {
            this.minimizeChatbot();
        });

        this.closeBtn.addEventListener('click', () => {
            this.closeChatbot();
        });

        // Send message
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Input handling
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.input.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // Quick replies
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-reply')) {
                const message = e.target.getAttribute('data-message');
                this.input.value = message;
                this.sendMessage();
            }
        });

        // Close on outside click (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                !this.chatbot.contains(e.target) && 
                !this.fab.contains(e.target) && 
                !this.isMinimized) {
                this.minimizeChatbot();
            }
        });
    }

    toggleChatbot() {
        if (this.isMinimized) {
            this.openChatbot();
        } else {
            this.minimizeChatbot();
        }
    }

    openChatbot() {
        this.chatbot.classList.add('active');
        this.fab.classList.add('active');
        this.isMinimized = false;
        
        // Auto-focus input on desktop
        if (window.innerWidth > 768) {
            setTimeout(() => {
                this.input.focus();
            }, 400);
        }
        
        // Scroll to bottom
        setTimeout(() => {
            this.scrollToBottom();
        }, 100);
    }

    minimizeChatbot() {
        this.chatbot.classList.remove('active');
        this.fab.classList.remove('active');
        this.isMinimized = true;
    }

    closeChatbot() {
        this.minimizeChatbot();
    }

    sendMessage() {
        const message = this.input.value.trim();
        if (!message || this.isProcessing) return;

        // Add user message
        this.addMessage(message, 'user');
        this.input.value = '';
        this.autoResizeTextarea();

        // Show typing indicator
        this.showTypingIndicator();

        // Process message
        this.processMessage(message);
    }

    addMessage(content, type = 'bot', showTime = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const time = showTime ? `<div class="message-time">${this.getCurrentTime()}</div>` : '';
        
        let messageHTML;
        if (type === 'bot') {
            messageHTML = `
                <div class="message-avatar">T</div>
                <div class="message-content">
                    <div class="message-bubble">${content}</div>
                    ${time}
                </div>
            `;
        } else {
            messageHTML = `
                <div class="message-content">
                    <div class="message-bubble">${content}</div>
                    ${time}
                </div>
            `;
        }
        
        messageDiv.innerHTML = messageHTML;

        // Remove quick replies if they exist
        const quickReplies = this.messagesContainer.querySelector('.quick-replies');
        if (quickReplies) {
            quickReplies.remove();
        }

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        return messageDiv;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.innerHTML = `
            <div class="message-avatar">T</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();

        return typingDiv;
    }

    hideTypingIndicator() {
        const typingIndicator = this.messagesContainer.querySelector('.typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async processMessage(message) {
        this.isProcessing = true;

        try {
            // Add to message history
            this.messageHistory.push({ role: 'user', content: message });

            // Prepare context for TYPNI
            const context = `You are a helpful assistant for TYPNI (The Young People's Network International), a youth-led organization in Kenya that focuses on empowering young people through various programs including:

- Youth Empowerment and Leadership
- Youth Mentorship Programs  
- Youth Employment and Entrepreneurship
- Financial Literacy Training
- Youth Representation and Advocacy

Our mission is to connect and empower young people globally through dynamic initiatives and programs that foster collective growth and positive transformation.

Key programs and focus areas:
- Leadership development workshops and summits
- Mentorship programs connecting youth with experienced professionals
- Employment and entrepreneurship training
- Financial literacy education
- Civic engagement and democracy building
- Climate action initiatives
- Youth representation in decision-making

Please provide helpful, accurate information about TYPNI's programs and services. Keep responses concise but informative, and maintain a friendly, encouraging tone suitable for young people.`;

            // Show typing indicator
            const typingIndicator = this.showTypingIndicator();

            // Call Gemini API
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${context}\n\nUser message: ${message}`
                        }]
                    }]
                })
            });

            // Hide typing indicator
            this.hideTypingIndicator();

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                const botResponse = data.candidates[0].content.parts[0].text;
                this.addMessage(botResponse, 'bot');
                this.messageHistory.push({ role: 'assistant', content: botResponse });
            } else if (data.error) {
                console.error('Gemini API Error:', data.error);
                this.addMessage("I'm currently experiencing technical difficulties. Please try again in a moment.", 'bot');
            } else {
                console.error('Unexpected API response:', data);
                this.addMessage("I didn't receive a proper response. Could you please rephrase your question?", 'bot');
            }

        } catch (error) {
            console.error('Error processing message:', error);
            this.hideTypingIndicator();
            
            let errorMessage = "I'm experiencing some technical difficulties. ";
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage += "Please check your internet connection and try again.";
            } else if (error.message.includes('HTTP error')) {
                errorMessage += "The AI service is temporarily unavailable. Please try again in a few minutes.";
            } else {
                errorMessage += "Please try rephrasing your question or contact our support team directly.";
            }
            
            this.addMessage(errorMessage, 'bot');
        } finally {
            this.isProcessing = false;
        }
    }

    autoResizeTextarea() {
        this.input.style.height = 'auto';
        this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    showNotification() {
        // Add a subtle notification dot or animation to the FAB
        this.fab.style.position = 'relative';
        
        const notificationDot = document.createElement('div');
        notificationDot.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            width: 12px;
            height: 12px;
            background: #ff4444;
            border-radius: 50%;
            border: 2px solid white;
            animation: pulse 2s infinite;
        `;
        
        this.fab.appendChild(notificationDot);

        // Remove notification when chat is opened
        const removeNotification = () => {
            if (notificationDot && notificationDot.parentNode) {
                notificationDot.remove();
            }
            this.fab.removeEventListener('click', removeNotification);
        };

        this.fab.addEventListener('click', removeNotification);
    }
}

// Initialize modern chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ModernChatbot();
});

// Export for global access
window.ModernChatbot = ModernChatbot;
