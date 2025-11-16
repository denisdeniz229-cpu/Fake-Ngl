# Deployment Rehberi - 7/24 Çalışan Sunucu

Bu uygulamayı 7/24 çalışan bir sunucuya deploy etmek için aşağıdaki seçeneklerden birini kullanabilirsiniz:

## Seçenek 1: Railway (Önerilen - Ücretsiz)

1. **Railway hesabı oluşturun:**
   - https://railway.app adresine gidin
   - GitHub ile giriş yapın

2. **Projeyi deploy edin:**
   - "New Project" butonuna tıklayın
   - "Deploy from GitHub repo" seçin
   - Repository'nizi seçin
   - Otomatik olarak deploy başlayacak

3. **Domain yapılandırması (ngl.link için):**
   - Railway dashboard'da projenize gidin
   - "Settings" > "Domains" bölümüne gidin
   - "Custom Domain" ekleyin
   - `ngl.link` domain'ini ekleyin (eğer domain sahibiyseniz)
   - DNS ayarlarını Railway'in verdiği bilgilere göre yapın

**Not:** `ngl.link` domain'i zaten başka bir servis tarafından kullanılıyor olabilir. Bu durumda:
- Kendi domain'inizi kullanabilirsiniz (örn: `yourdomain.com`)
- Veya Railway'in verdiği ücretsiz domain'i kullanabilirsiniz (örn: `your-app.railway.app`)

## Seçenek 2: Render (Ücretsiz)

1. **Render hesabı oluşturun:**
   - https://render.com adresine gidin
   - GitHub ile giriş yapın

2. **Projeyi deploy edin:**
   - "New +" > "Web Service" seçin
   - GitHub repository'nizi bağlayın
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - "Create Web Service" butonuna tıklayın

3. **Domain yapılandırması:**
   - Settings > Custom Domains
   - Domain ekleyin ve DNS ayarlarını yapın

## Seçenek 3: Vercel (Ücretsiz)

1. **Vercel hesabı oluşturun:**
   - https://vercel.com adresine gidin
   - GitHub ile giriş yapın

2. **Projeyi deploy edin:**
   - "Add New Project" butonuna tıklayın
   - Repository'nizi seçin
   - Framework Preset: "Other"
   - Build Command: boş bırakın
   - Output Directory: boş bırakın
   - "Deploy" butonuna tıklayın

3. **Domain yapılandırması:**
   - Project Settings > Domains
   - Domain ekleyin

## Domain Yapılandırması (ngl.link için)

**ÖNEMLİ:** `ngl.link` domain'i zaten mevcut bir servis tarafından kullanılıyor. Bu yüzden:

1. **Kendi domain'inizi kullanın:**
   - Örnek: `yourdomain.com`, `anonimsoru.com`, vb.
   - Domain satın alın (Namecheap, GoDaddy, vb.)
   - DNS ayarlarını deployment platform'unuzun verdiği bilgilere göre yapın

2. **Veya subdomain kullanın:**
   - Örnek: `ngl.yourdomain.com`
   - Bu şekilde `ngl.link` ile çelişmezsiniz

3. **URL formatı:**
   - Deploy edildikten sonra URL formatı şöyle olacak:
   - `yourdomain.com/vs` (vs kullanıcı adı için)
   - `yourdomain.com/defnw_17` (defnw_17 kullanıcı adı için)

## Server.js'de Domain Ayarları

Deploy edildikten sonra, `server.js` dosyasında domain bilgisini güncellemeniz gerekebilir. Şu anki kod otomatik olarak doğru domain'i kullanacaktır.

## Test Etme

Deploy edildikten sonra:
1. Ana sayfa: `https://yourdomain.com`
2. Mesaj sayfası: `https://yourdomain.com/kullanici_adi`
3. Admin paneli: `https://yourdomain.com/admin`

## Notlar

- Tüm platformlar ücretsiz plan sunar (sınırlı kaynaklarla)
- Database (SQLite) dosyası platform'da saklanır
- Upload edilen görseller platform'da saklanır
- 48 saatlik bağlantı süresi otomatik olarak çalışır

