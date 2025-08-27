// Get Gemini API key from environment variables
const GEMINI_API_KEY = 'AIzaSyBK08X0hbD0XtQipnxDz_vc09rcKsnbgFo';

class Chatbot {
    constructor() {
        // Initialize properties first
        this.messageHistory = [];
        this.isProcessing = false;
        
        // Then initialize the UI
        this.initialize();
        
        // Listen for typing complete events
        document.addEventListener('typingComplete', (e) => {
            const messageDiv = e.detail.messageDiv;
            messageDiv.classList.add('typing-complete');
        });
    }

    initialize() {
        // Create chat widget HTML
        const chatWidget = document.createElement('div');
        chatWidget.className = 'chat-widget';
        chatWidget.innerHTML = `
            <div class="chat-button">
                <i class="fas fa-comments"></i>
                <span class="notification-badge">1</span>
            </div>
            <div class="chat-box">
                <div class="chat-header">
                    <div class="typni-logo"></div>
                    <h4>TYPNI AI</h4>
                    <div class="chat-actions">
                        <span class="voice-input" title="Voice input"><i class="fas fa-microphone"></i></span>
                        <span class="clear-chat" title="Clear chat"><i class="fas fa-broom"></i></span>
                        <span class="close-chat">&times;</span>
                    </div>
                </div>
                <div class="chat-messages">
                    <div class="message bot">
                        Hello! 👋 Welcome to TYPNI. How can I help you today?
                    </div>
                    <div class="quick-prompts">
                        <div class="prompt-chip">🎓 Youth Programs</div>
                        <div class="prompt-chip">🏆 Upcoming Events</div>
                        <div class="prompt-chip">💼 Careers & Opportunities</div>
                        <div class="prompt-chip">🎵 Youth Culture</div>
                    </div>
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
                <div class="chat-input">
                    <input type="text" placeholder="Type your message...">
                    <button>↑</button>
                </div>
                <div class="theme-picker">
                    <div class="theme-option" data-theme="violet" style="background-color: #390099;"></div>
                    <div class="theme-option" data-theme="yellow" style="background-color: #FFBD00;"></div>
                    <div class="theme-option" data-theme="berry" style="background-color: #9E0059;"></div>
                    <div class="theme-option" data-theme="flamingo" style="background-color: #FF0054;"></div>
                </div>
                <div class="emoji-picker" style="display: none !important;">
                    <div class="emoji-group">
                        <span class="emoji-item">😊</span>
                        <span class="emoji-item">😂</span>
                        <span class="emoji-item">👍</span>
                        <span class="emoji-item">❤️</span>
                        <span class="emoji-item">🔥</span>
                        <span class="emoji-item">🎉</span>
                        <span class="emoji-item">🙏</span>
                        <span class="emoji-item">✨</span>
                    </div>
                </div>
                <div class="bg-pattern-picker">
                    <div class="bg-pattern-option" data-pattern="default"></div>
                    <div class="bg-pattern-option" data-pattern="circles"></div>
                    <div class="bg-pattern-option" data-pattern="waves"></div>
                    <div class="bg-pattern-option" data-pattern="geometric"></div>
                </div>
            </div>
        `;

        // Append to body
        document.body.appendChild(chatWidget);

        // Initialize elements
        this.chatButton = chatWidget.querySelector('.chat-button');
        this.notificationBadge = chatWidget.querySelector('.notification-badge');
        this.chatBox = chatWidget.querySelector('.chat-box');
        this.closeButton = chatWidget.querySelector('.close-chat');
        this.clearButton = chatWidget.querySelector('.clear-chat');
        this.voiceButton = chatWidget.querySelector('.voice-input');
        this.promptChips = chatWidget.querySelectorAll('.prompt-chip');
        this.input = chatWidget.querySelector('.chat-input input');
        this.sendButton = chatWidget.querySelector('.chat-input button');
        this.messagesContainer = chatWidget.querySelector('.chat-messages');
        this.typingIndicator = chatWidget.querySelector('.typing-indicator');
        
        // New elements
        this.emojiPicker = chatWidget.querySelector('.emoji-picker');
        this.emojiItems = chatWidget.querySelectorAll('.emoji-item');
        

        // Add event listeners
        this.chatButton.addEventListener('click', () => {
            this.toggleChat();
            this.hideNotificationBadge();
        });
        this.closeButton.addEventListener('click', () => this.toggleChat());
        this.clearButton.addEventListener('click', () => this.clearChat());
        this.voiceButton.addEventListener('click', () => this.toggleVoiceInput());
        this.promptChips.forEach(chip => {
            chip.addEventListener('click', (e) => this.usePromptChip(e.target.textContent));
        });
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Emoji functionality disabled
        

        // Show notification after 2 seconds
        setTimeout(() => {
            if (!this.chatBox.classList.contains('active')) {
                this.showNotificationBadge();
            }
        }, 2000);

        // Load chat history from localStorage
        this.loadChatHistory();
        
        // Load saved theme if any
        this.loadSavedTheme();
        
        // Load saved background pattern
        this.loadSavedBgPattern();
        
        // Initialize speech recognition if available
        this.initSpeechRecognition();
    }

    initSpeechRecognition() {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.input.value = transcript;
                this.voiceButton.classList.remove('active');
            };
            
            this.recognition.onend = () => {
                this.voiceButton.classList.remove('active');
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                this.voiceButton.classList.remove('active');
            };
        } else {
            this.voiceButton.style.display = 'none';
            console.log('Speech recognition not supported in this browser');
        }
    }
    
    toggleVoiceInput() {
        if (!this.recognition) return;
        
        if (this.voiceButton.classList.contains('active')) {
            this.recognition.stop();
            this.voiceButton.classList.remove('active');
        } else {
            this.recognition.start();
            this.voiceButton.classList.add('active');
            this.input.placeholder = 'Listening...';
        }
    }

    toggleChat() {
        this.chatBox.classList.toggle('active');
        const isActive = this.chatBox.classList.contains('active');
        
        if (isActive) {
            this.input.focus();
            // Prevent body scrolling on mobile when chat is open
            if (window.innerWidth <= 768) {
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
                document.body.style.top = `-${window.scrollY}px`;
            }
        } else {
            // Restore body scrolling on mobile when chat is closed
            if (window.innerWidth <= 768) {
                const scrollY = document.body.style.top;
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                document.body.style.top = '';
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }
    }

    async sendMessage() {
        if (this.isProcessing) return;

        const message = this.input.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        this.input.value = '';
        this.input.disabled = true;
        this.sendButton.disabled = true;
        this.isProcessing = true;

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.getGeminiResponse(message);
            this.hideTypingIndicator();
            // Instead of adding the message directly, use the typing animation
            this.addMessageWithTypingEffect(response, 'bot');
        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.addMessageWithTypingEffect("I apologize for the technical difficulty. Our team has been notified and is working to resolve this. Please try again in a few moments.", 'bot');
        } finally {
            this.input.disabled = false;
            this.sendButton.disabled = false;
            this.isProcessing = false;
            this.input.focus();
        }
    }

    addMessage(text, sender) {
        // Initialize messageHistory if not already done
        if (!this.messageHistory) {
            this.messageHistory = [];
        }
        
        if (sender === 'user') {
            // User messages should be displayed immediately without typing animation
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}`;
            messageDiv.textContent = text;
            
            // Insert message div before typing indicator
            this.messagesContainer.insertBefore(messageDiv, this.typingIndicator);
            
            // Scroll to bottom
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            
            // Save to history
            this.messageHistory.push({ text, sender });
            this.saveChatHistory();
        } else {
            // Bot messages use typing animation
            this.addMessageWithTypingEffect(text, sender);
        }
    }

    showTypingIndicator() {
        this.typingIndicator.classList.add('show');
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        this.typingIndicator.classList.remove('show');
    }

    async getGeminiResponse(message) {
        // Build conversation history context
        const contextMessages = this.messageHistory.slice(-6).map(msg => 
            `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
        ).join('\n\n');
        
        // Check if this is a new conversation or continuing
        const isNewConversation = this.messageHistory.length <= 1;

        // Check if the message is related to TYPNI
        const typniKeywords = ['typni', 'youth', 'program', 'event', 'career', 'opportunity', 'empower', 'kenya', 'charlene', 'ruto'];
        const isTypniRelated = typniKeywords.some(keyword => message.toLowerCase().includes(keyword));
        
        let systemPrompt;
        
        if (isTypniRelated) {
            systemPrompt = `You are TYPNI's AI assistant. You help users with information about youth empowerment programs, events, and initiatives in Kenya.

Your responses should be:
1. Professional, friendly, and focused on TYPNI's mission
2. Formatted for readability using these markdown-style conventions:
   - Use **bold** for emphasis and headers
   - Use bullet points (with "- " prefix) for lists
   - Keep paragraphs short and use line breaks effectively
3. ${isNewConversation ? 'This is a new conversation, so introduce yourself briefly.' : 'This is a continuing conversation, so DO NOT introduce yourself or greet the user again. Just respond to their query directly.'}
4. Focus only on the user's current query and previous context. Be direct and helpful.

Previous conversation:
${contextMessages}

User message: ${message}`;
        } else {
            // For non-TYPNI related queries, use a more general prompt
            systemPrompt = `You are a helpful AI assistant. You provide informative and concise responses to user queries.

Your responses should be:
1. Professional and friendly
2. Formatted for readability using these markdown-style conventions:
   - Use **bold** for emphasis and headers
   - Use bullet points (with "- " prefix) for lists
   - Keep paragraphs short and use line breaks effectively
3. ${isNewConversation ? 'This is a new conversation, so introduce yourself briefly.' : 'This is a continuing conversation, so DO NOT introduce yourself or greet the user again. Just respond to their query directly.'}
4. Focus only on the user's current query and previous context. Be direct and helpful.
5. Do NOT mention TYPNI unless the user specifically asks about it.

Previous conversation:
${contextMessages}

User message: ${message}`;
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: systemPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error Response:', errorData);
                throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log('Gemini API Response:', data); // Debug log
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                return data.candidates[0].content.parts[0].text;
            } else {
                console.error('Invalid API Response Structure:', data);
                throw new Error('Invalid response format from Gemini API');
            }
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error('Failed to get response from Gemini API: ' + error.message);
        }
    }

    saveChatHistory() {
        // Only save last 50 messages to prevent localStorage overflow
        const limitedHistory = this.messageHistory.slice(-50);
        localStorage.setItem('chatHistory', JSON.stringify(limitedHistory));
    }

    loadChatHistory() {
        const history = localStorage.getItem('chatHistory');
        if (history) {
            this.messageHistory = JSON.parse(history);
            
            // Clear any existing welcome message first
            while (this.messagesContainer.firstChild) {
                if (this.messagesContainer.firstChild === this.typingIndicator) {
                    break;
                }
                this.messagesContainer.removeChild(this.messagesContainer.firstChild);
            }
            
            // Add messages without animation effect to avoid overwhelming UX
            this.messageHistory.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${message.sender}`;
                
                const textContainer = document.createElement('div');
                textContainer.className = 'message-text';
                
                if (message.sender === 'bot') {
                    // Format the bot message with HTML
                    let formattedText = message.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/^- (.*?)$/gm, '<li>$1</li>')
                        .replace(/\n/g, '<br>');
                    
                    if (formattedText.includes('<li>')) {
                        formattedText = formattedText.replace(/<br><li>/g, '<li>');
                        formattedText = formattedText.replace(/<li>(.*?)(?=<li>|$)/g, '<li>$1</li>');
                        formattedText = formattedText.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
                    }
                    
                    textContainer.innerHTML = formattedText;
                    
                    // Add class to indicate typing is done
                    messageDiv.classList.add('typing-complete');
                } else {
                    // For user messages, just set the text content directly
                    textContainer.textContent = message.text;
                }
                
                messageDiv.appendChild(textContainer);
                this.messagesContainer.insertBefore(messageDiv, this.typingIndicator);
            });
            
            // Scroll to bottom after loading history
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    // Add the clear chat method
    clearChat() {
        // Remove all messages except the typing indicator
        while (this.messagesContainer.firstChild) {
            if (this.messagesContainer.firstChild === this.typingIndicator) {
                break;
            }
            this.messagesContainer.removeChild(this.messagesContainer.firstChild);
        }

        // Add welcome message back with typing animation
        const welcomeText = 'Hello! 👋 Welcome to TYPNI. How can I help you today?';
        this.addMessageWithTypingEffect(welcomeText, 'bot');
        
        // Re-add the quick prompts
        const quickPrompts = document.createElement('div');
        quickPrompts.className = 'quick-prompts';
        quickPrompts.innerHTML = `
            <div class="prompt-chip">🎓 Youth Programs</div>
            <div class="prompt-chip">🏆 Upcoming Events</div>
            <div class="prompt-chip">💼 Careers & Opportunities</div>
            <div class="prompt-chip">🎵 Youth Culture</div>
        `;
        this.messagesContainer.insertBefore(quickPrompts, this.typingIndicator);
        
        // Add click handlers to the new prompt chips
        const promptChips = quickPrompts.querySelectorAll('.prompt-chip');
        promptChips.forEach(chip => {
            chip.addEventListener('click', (e) => this.usePromptChip(e.target.textContent));
        });

        // Clear message history
        this.messageHistory = [];
        localStorage.removeItem('chatHistory');
    }

    toggleThemePicker() {
        this.themePicker.classList.toggle('visible');
    }
    
    changeTheme(theme) {
        // Remove all theme classes
        this.chatBox.classList.remove('theme-violet', 'theme-yellow', 'theme-berry', 'theme-flamingo');
        
        // Add the selected theme class
        this.chatBox.classList.add(`theme-${theme}`);
        
        // Update active state in theme picker
        this.themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === theme) {
                option.classList.add('active');
            }
        });
        
        // Save theme preference
        localStorage.setItem('typni-chatbot-theme', theme);
        
        // Hide theme picker
        this.themePicker.classList.remove('visible');
    }
    
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('typni-chatbot-theme');
        if (savedTheme) {
            this.changeTheme(savedTheme);
        } else {
            // Set default theme to flamingo
            this.changeTheme('flamingo');
        }
    }
    
    usePromptChip(promptText) {
        let query = '';
        
        // Extract the text without emoji
        const textOnly = promptText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
        
        // Map to specific queries
        if (textOnly === 'Youth Programs') {
            query = "What youth programs does TYPNI offer?";
        } else if (textOnly === 'Upcoming Events') {
            query = "What are the upcoming TYPNI events?";
        } else if (textOnly === 'Careers & Opportunities') {
            query = "What career opportunities are available for youth through TYPNI?";
        } else if (textOnly === 'Youth Culture') {
            query = "How does TYPNI support youth culture and creativity?";
        } else {
            query = textOnly;
        }
        
        // Set the input value and send
        this.input.value = query;
        this.sendMessage();
    }

    addMessageWithTypingEffect(text, sender) {
        // Initialize messageHistory if not already done
        if (!this.messageHistory) {
            this.messageHistory = [];
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        // Insert message div before typing indicator
        this.messagesContainer.insertBefore(messageDiv, this.typingIndicator);
        
        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        
        // Save to history - do this early so context is preserved for future messages
        this.messageHistory.push({ text, sender });
        this.saveChatHistory();
        
        if (sender === 'bot') {
            // For bot messages, animate typing effect
            
            // First prepare the formatted text
            let formattedText = text
                // Bold text (convert **text** to <strong>text</strong>)
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Italic text (convert *text* to <em>text</em>)
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                // Convert bullet points (- item) to HTML list items
                .replace(/^- (.*?)$/gm, '<li>$1</li>')
                // Handle line breaks
                .replace(/\n/g, '<br>');
            
            // Wrap list items in an unordered list if they exist
            if (formattedText.includes('<li>')) {
                formattedText = formattedText.replace(/<br><li>/g, '<li>');
                formattedText = formattedText.replace(/<li>(.*?)(?=<li>|$)/g, '<li>$1</li>');
                formattedText = formattedText.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
            }
            
            // Create a temporary div to store the formatted HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = formattedText;
            
            // Create a plain text version for typing animation
            const plainText = tempDiv.textContent || formattedText.replace(/<[^>]*>/g, '');
            
            // Start typing effect
            let i = 0;
            const typingSpeed = 25; // Increased from 10 to 25ms
            const words = plainText.split(/(\s+)/); // Split by whitespace but keep the spaces
            let currentText = '';
            
            const typeNextWord = () => {
                if (i < words.length) {
                    const word = words[i];
                    currentText += word;
                    
                    // Update the message div content directly
                    messageDiv.innerHTML = currentText;
                    i++;
                    
                    // Scroll to the bottom as text is being typed
                    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
                    
                    // Schedule next word
                    setTimeout(typeNextWord, typingSpeed);
                } else {
                    // Typing complete - replace with formatted text
                    messageDiv.innerHTML = formattedText;
                    
                    // Signal completion
                    const typingCompleteEvent = new CustomEvent('typingComplete', { detail: { messageDiv } });
                    document.dispatchEvent(typingCompleteEvent);
                }
            };
            
            // Start the typing animation
            setTimeout(typeNextWord, 500); // Small initial delay
        } else {
            // For user messages, just set the text content directly
            messageDiv.textContent = text;
        }
    }


    
    showNotificationBadge() {
        this.notificationBadge.classList.add('visible');
    }
    
    hideNotificationBadge() {
        this.notificationBadge.classList.remove('visible');
    }

    toggleBgPatternPicker() {
        this.bgPatternPicker.classList.toggle('visible');
        // Hide theme picker if open
        this.themePicker.classList.remove('visible');
    }
    
    changeBgPattern(pattern) {
        // Remove all pattern classes
        this.messagesContainer.classList.remove('bg-pattern-default', 'bg-pattern-circles', 'bg-pattern-waves', 'bg-pattern-geometric');
        
        // Add the selected pattern class
        this.messagesContainer.classList.add(`bg-pattern-${pattern}`);
        
        // Update active state in pattern picker
        this.bgPatternOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.pattern === pattern) {
                option.classList.add('active');
            }
        });
        
        // Save pattern preference
        localStorage.setItem('typni-chatbot-pattern', pattern);
        
        // Hide pattern picker
        this.bgPatternPicker.classList.remove('visible');
    }
    
    loadSavedBgPattern() {
        const savedPattern = localStorage.getItem('typni-chatbot-pattern');
        if (savedPattern) {
            this.changeBgPattern(savedPattern);
        } else {
            // Set default pattern
            this.changeBgPattern('default');
        }
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Chatbot();
});