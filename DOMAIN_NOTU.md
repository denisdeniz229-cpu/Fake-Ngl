# Domain Hakkında Önemli Not

## ngl.link Domain'i Hakkında

**ÖNEMLİ:** `ngl.link` domain'i zaten mevcut bir servis (gerçek NGL uygulaması) tarafından kullanılıyor. Bu yüzden:

### Seçenekler:

1. **Kendi Domain'inizi Kullanın (Önerilen):**
   - Örnek: `yourdomain.com`, `anonimsoru.com`, `anonimmesaj.com`
   - Domain satın alın (Namecheap, GoDaddy, Porkbun, vb.)
   - Deployment platform'unuzda custom domain olarak ekleyin
   - URL formatı: `yourdomain.com/kullanici_adi`

2. **Subdomain Kullanın:**
   - Örnek: `ngl.yourdomain.com`
   - Bu şekilde `ngl.link` ile çelişmezsiniz
   - URL formatı: `ngl.yourdomain.com/kullanici_adi`

3. **Platform'un Ücretsiz Domain'ini Kullanın:**
   - Railway: `your-app.railway.app`
   - Render: `your-app.onrender.com`
   - Vercel: `your-app.vercel.app`
   - URL formatı: `your-app.railway.app/kullanici_adi`

### Deployment Sonrası

Deploy edildikten sonra, kod otomatik olarak doğru domain'i kullanacaktır. Sadece deployment platform'unuzda custom domain eklemeniz yeterli.

### Kod İçinde

Kod içinde `ngl.link` yazıları sadece görsel amaçlıdır. Gerçek domain deployment platform'unuzda ayarladığınız domain olacaktır.

