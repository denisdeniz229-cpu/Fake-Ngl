# Hızlı Deployment Rehberi

## Railway ile Deploy (En Kolay - 5 Dakika)

1. **GitHub'a yükleyin:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Railway'a gidin:**
   - https://railway.app
   - GitHub ile giriş yapın
   - "New Project" > "Deploy from GitHub repo"
   - Repository'nizi seçin
   - Otomatik deploy başlar!

3. **Domain ekleyin (isteğe bağlı):**
   - Settings > Domains
   - Custom domain ekleyin
   - DNS ayarlarını yapın

**Hazır!** Artık uygulamanız 7/24 çalışıyor!

## Render ile Deploy (Alternatif)

1. **GitHub'a yükleyin** (yukarıdaki adımlar)

2. **Render'a gidin:**
   - https://render.com
   - GitHub ile giriş yapın
   - "New +" > "Web Service"
   - Repository seçin
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - "Create Web Service"

**Hazır!** Uygulamanız 7/24 çalışıyor!

## Domain Notu

`ngl.link` zaten kullanılıyor. Kendi domain'inizi kullanın veya platform'un verdiği domain'i kullanın.

Deploy edildikten sonra:
- Ana sayfa: `https://your-domain.com`
- Mesaj sayfası: `https://your-domain.com/kullanici_adi`
- Admin: `https://your-domain.com/admin`

