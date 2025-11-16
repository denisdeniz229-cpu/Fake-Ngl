document.addEventListener('DOMContentLoaded', () => {
    const profileImageInput = document.getElementById('profileImage');
    const imagePreview = document.getElementById('imagePreview');
    const usernameInput = document.getElementById('username');
    const createLinkBtn = document.getElementById('createLinkBtn');
    const resultDiv = document.getElementById('result');

    // Image preview
    profileImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Create link
    createLinkBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const file = profileImageInput.files[0];

        if (!username) {
            showResult('Lütfen kullanıcı adı girin!', 'error');
            return;
        }

        if (!file) {
            showResult('Lütfen profil görseli yükleyin!', 'error');
            return;
        }

        createLinkBtn.disabled = true;
        createLinkBtn.textContent = 'Oluşturuluyor...';

        const formData = new FormData();
        formData.append('username', username);
        formData.append('profileImage', file);

        try {
            const response = await fetch('/api/setup', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Format link as ngl.link/username (or current domain if not deployed)
                const domain = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                    ? 'ngl.link' 
                    : window.location.hostname;
                const protocol = window.location.protocol;
                const fullLink = `${protocol}//${domain}${data.link}`;
                const displayLink = `ngl.link${data.link}`;
                
                showResult(`Bağlantı oluşturuldu! Link: ${displayLink}`, 'success');
                // Copy actual link to clipboard if possible
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(fullLink);
                }
                // Redirect after 3 seconds
                setTimeout(() => {
                    window.location.href = data.link;
                }, 3000);
            } else {
                showResult(data.error || 'Bir hata oluştu!', 'error');
                createLinkBtn.disabled = false;
                createLinkBtn.textContent = 'Bağlantı Oluştur';
            }
        } catch (error) {
            showResult('Sunucu hatası!', 'error');
            createLinkBtn.disabled = false;
            createLinkBtn.textContent = 'Bağlantı Oluştur';
        }
    });

    function showResult(message, type) {
        resultDiv.textContent = message;
        resultDiv.className = `result-message ${type}`;
    }
});

