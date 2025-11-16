let currentLinkId = null;
let authToken = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    authToken = localStorage.getItem('adminToken');
    if (authToken === 'authenticated') {
        showAdminPanel();
    }

    // Login form
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Load links
    if (authToken === 'authenticated') {
        loadLinks();
    }
});

async function handleLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');

    errorDiv.classList.remove('show');

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('adminToken', 'authenticated');
            showAdminPanel();
            loadLinks();
        } else {
            errorDiv.textContent = data.error || 'Giriş başarısız!';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Sunucu hatası!';
        errorDiv.classList.add('show');
    }
}

function handleLogout() {
    localStorage.removeItem('adminToken');
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
}

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
}

async function loadLinks() {
    try {
        const response = await fetch('/api/admin/links');
        const data = await response.json();

        if (!response.ok) {
            console.error('Error loading links');
            return;
        }

        displayLinks(data);
    } catch (error) {
        console.error('Error loading links:', error);
    }
}

function displayLinks(links) {
    const linksList = document.getElementById('linksList');
    linksList.innerHTML = '';

    if (links.length === 0) {
        linksList.innerHTML = '<p class="empty-state">Henüz bağlantı oluşturulmamış</p>';
        return;
    }

    links.forEach(link => {
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        if (link.id === currentLinkId) {
            linkItem.classList.add('active');
        }

        const statusClass = link.isExpired ? 'expired' : (link.is_active ? 'active' : 'inactive');
        const statusText = link.isExpired ? 'Süresi Dolmuş' : (link.is_active ? 'Aktif' : 'İptal');

        linkItem.innerHTML = `
            <div class="link-item-header">
                <span class="link-username">@${link.username}</span>
                <span class="link-status ${statusClass}">${statusText}</span>
            </div>
            <div class="link-info">
                <div>Bağlantı: <a href="/${link.link_code}" target="_blank">ngl.link/${link.link_code}</a></div>
                <div>Oluşturulma: ${formatDate(link.created_at)}</div>
                <div>Kalan Süre: ${link.hoursLeft} saat</div>
                <div>Mesaj Sayısı: ${link.message_count}</div>
            </div>
            ${link.is_active && !link.isExpired ? `<button class="btn-deactivate" onclick="deactivateLink(${link.id}, event)">İptal Et</button>` : ''}
        `;

        linkItem.addEventListener('click', () => {
            // Remove active class from all items
            document.querySelectorAll('.link-item').forEach(item => {
                item.classList.remove('active');
            });
            linkItem.classList.add('active');
            currentLinkId = link.id;
            loadMessages(link.id);
        });

        linksList.appendChild(linkItem);
    });
}

async function loadMessages(linkId) {
    try {
        const response = await fetch(`/api/admin/link/${linkId}/messages`);
        const data = await response.json();

        if (!response.ok) {
            console.error('Error loading messages');
            return;
        }

        displayMessages(data);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function displayMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '';

    if (messages.length === 0) {
        messagesList.innerHTML = '<p class="empty-state">Henüz mesaj yok</p>';
        return;
    }

    messages.forEach(message => {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item';

        const diceBadge = message.is_dice_question ? '<span class="dice-badge">Zar ile yazdırıldı</span>' : '';

        let statesHTML = '';
        if (message.states && message.states.length > 0) {
            // Filter out duplicate consecutive states and the final message
            const uniqueStates = [];
            let lastState = '';
            message.states.forEach(state => {
                if (state !== lastState && state !== message.message_text) {
                    uniqueStates.push(state);
                    lastState = state;
                }
            });
            
            statesHTML = `
                <div class="message-states">
                    <div class="message-states-title">Yazım Geçmişi (Harf Harf):</div>
                    ${uniqueStates.map(state => `<div class="state-item">"${escapeHtml(state)}"</div>`).join('')}
                    ${message.message_text ? `<div class="state-item"><strong>"${escapeHtml(message.message_text)}" ✓ (Gönderildi)</strong></div>` : ''}
                </div>
            `;
        } else if (message.message_text) {
            statesHTML = `
                <div class="message-states">
                    <div class="message-states-title">Mesaj:</div>
                    <div class="state-item"><strong>"${escapeHtml(message.message_text)}"</strong></div>
                </div>
            `;
        }

        messageItem.innerHTML = `
            <div class="message-header">
                <span class="message-sender">@${message.sender_username}</span>
                <span class="message-time">${formatDate(message.created_at)}</span>
            </div>
            ${message.message_text ? `<div class="message-text">${message.message_text}${diceBadge}</div>` : ''}
            ${statesHTML}
        `;

        messagesList.appendChild(messageItem);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function deactivateLink(linkId, event) {
    event.stopPropagation();
    
    if (!confirm('Bu bağlantıyı iptal etmek istediğinize emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/link/${linkId}/deactivate`, {
            method: 'POST'
        });
        
        if (response.ok) {
            loadLinks();
            if (currentLinkId === linkId) {
                currentLinkId = null;
                document.getElementById('messagesList').innerHTML = '<p class="empty-state">Bir bağlantı seçin</p>';
            }
        } else {
            alert('Bağlantı iptal edilemedi!');
        }
    } catch (error) {
        console.error('Error deactivating link:', error);
        alert('Sunucu hatası!');
    }
}

