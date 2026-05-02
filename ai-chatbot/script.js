const chatHistory = document.getElementById('chat-history');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');

// Simulated AI Knowledge Base
const AI_RESPONSES = [
    {
        keywords: ['hello', 'hi', 'hey'],
        response: "Hello! How can I assist you today?"
    },
    {
        keywords: ['how are you', 'how do you do'],
        response: "I'm just a simulated AI made of JavaScript, but I'm functioning perfectly! How are you?"
    },
    {
        keywords: ['who are you', 'what are you', 'your name'],
        response: "I am DezineeeBot, a conversational AI model created by Emon Mukherjee to demonstrate frontend development skills."
    },
    {
        keywords: ['website', 'build', 'create', 'code', 'html', 'css', 'javascript'],
        response: "Building websites is Emon's specialty! If you need a high-performance, beautiful web application, you should definitely hire him."
    },
    {
        keywords: ['joke', 'funny'],
        response: "Why do programmers prefer dark mode? Because light attracts bugs! 🐛"
    },
    {
        keywords: ['thank'],
        response: "You're very welcome! Let me know if you need anything else."
    }
];

const DEFAULT_RESPONSES = [
    "That is an interesting point. Can you tell me more about that?",
    "I understand. As an AI, I am still learning about that topic.",
    "Could you rephrase that? I want to make sure I give you the best answer.",
    "Fascinating! Emon programmed me to be polite, so I will say: please go on."
];

// Enable/Disable send button
userInput.addEventListener('input', () => {
    sendBtn.disabled = userInput.value.trim() === '';
    
    // Auto-resize textarea
    userInput.style.height = 'auto';
    userInput.style.height = (userInput.scrollHeight) + 'px';
});

// Submit on Enter (Shift+Enter for new line)
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            handleSubmission();
        }
    }
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmission();
});

function handleSubmission() {
    const text = userInput.value.trim();
    if (!text) return;
    
    // Add user message
    addMessage(text, 'user');
    
    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;
    
    // Simulate AI thinking and replying
    simulateAIResponse(text);
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    
    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.textContent = sender === 'user' ? '👤' : '🤖';
    
    const content = document.createElement('div');
    content.classList.add('message-content');
    const p = document.createElement('p');
    p.textContent = text;
    content.appendChild(p);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    // Insert before typing indicator if it exists
    chatHistory.appendChild(messageDiv);
    scrollToBottom();
}

function simulateAIResponse(userText) {
    // Show typing indicator
    chatHistory.appendChild(typingIndicator);
    typingIndicator.classList.remove('hidden');
    scrollToBottom();
    
    // Simulate network delay (1 to 2.5 seconds)
    const delay = Math.floor(Math.random() * 1500) + 1000;
    
    setTimeout(() => {
        // Hide typing indicator
        typingIndicator.classList.add('hidden');
        
        // Generate response
        const responseText = generateResponse(userText.toLowerCase());
        addMessage(responseText, 'ai');
    }, delay);
}

function generateResponse(text) {
    // Check for keyword matches
    for (let item of AI_RESPONSES) {
        if (item.keywords.some(kw => text.includes(kw))) {
            return item.response;
        }
    }
    
    // Return random default response if no keywords matched
    return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
}

function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}
