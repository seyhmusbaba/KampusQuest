const nodemailer = require('nodemailer');

/* ══════════════════════════════════════════════════════
   E-POSTA SERVİSİ
   Desteklenen sağlayıcılar: Gmail, Outlook/Hotmail, veya SMTP
══════════════════════════════════════════════════════ */

function createTransport() {
  const provider = process.env.MAIL_PROVIDER || 'gmail';

  if (provider === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS, // Gmail App Password (16 hane)
      },
    });
  }

  if (provider === 'outlook') {
    return nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  // Özel SMTP
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

async function sendVerificationEmail(toEmail, username, code) {
  const transport = createTransport();
  const fromName  = process.env.MAIL_FROM_NAME || 'KampüsQuest MKÜ';
  const fromAddr  = process.env.MAIL_USER;

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#060c1c;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060c1c;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" style="background:rgba(10,15,30,.98);border:1px solid rgba(139,26,26,.3);border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#8B1A1A,#6b1212);padding:28px 32px;text-align:center;">
            <img src="https://i.imgur.com/placeholder.png" alt="MKÜ" width="60" style="border-radius:50%;margin-bottom:12px;" />
            <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:.08em;font-family:monospace;">KampüsQuest</div>
            <div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:4px;letter-spacing:.06em;">HATAY MUSTAFA KEMAL ÜNİVERSİTESİ</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <div style="font-size:15px;color:#e2e8f0;margin-bottom:8px;">Merhaba <b style="color:#fff;">${username}</b> 👋</div>
            <div style="font-size:13px;color:rgba(148,163,184,.7);line-height:1.7;margin-bottom:24px;">
              KampüsQuest hesabınızı doğrulamak için aşağıdaki 6 haneli kodu kullanın.<br>
              Bu kod <b style="color:#ffd700;">15 dakika</b> geçerlidir.
            </div>

            <!-- Kod kutusu -->
            <div style="text-align:center;margin:24px 0;">
              <div style="display:inline-block;background:rgba(139,26,26,.15);border:2px solid rgba(139,26,26,.5);border-radius:14px;padding:20px 36px;">
                <div style="font-size:10px;color:rgba(148,163,184,.5);font-family:monospace;letter-spacing:.12em;margin-bottom:8px;">DOĞRULAMA KODU</div>
                <div style="font-size:42px;font-weight:900;color:#fff;font-family:monospace;letter-spacing:.3em;text-shadow:0 0 20px rgba(139,26,26,.8);">${code}</div>
              </div>
            </div>

            <div style="font-size:11px;color:rgba(148,163,184,.4);text-align:center;margin-top:16px;">
              Bu kodu kimseyle paylaşmayın.<br>
              Eğer bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid rgba(255,255,255,.06);text-align:center;">
            <div style="font-size:10px;color:rgba(148,163,184,.3);font-family:monospace;">
              KampüsQuest · Hatay Mustafa Kemal Üniversitesi<br>
              Tayfur Sökmen Kampüsü · Alahan, Antakya, Hatay
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transport.sendMail({
    from:    `"${fromName}" <${fromAddr}>`,
    to:      toEmail,
    subject: `${code} — KampüsQuest Doğrulama Kodu`,
    html,
    text: `Merhaba ${username},\n\nKampüsQuest doğrulama kodunuz: ${code}\n\nBu kod 15 dakika geçerlidir.\n\nKampüsQuest — MKÜ`,
  });
}

module.exports = { sendVerificationEmail };
