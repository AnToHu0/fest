import { useRuntimeConfig } from '#imports';

interface VerificationEmailParams {
  fullName: string;
  verificationToken: string;
}

export function generateVerificationEmail({ fullName, verificationToken }: VerificationEmailParams): string {
  const config = useRuntimeConfig();
  const baseURL = config.baseURL;
  const verificationUrl = `${baseURL}?token=${verificationToken}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подтверждение регистрации</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .logo {
      max-width: 200px;
      height: auto;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
    }
    .button {
      display: inline-block;
      background-color: #4a6da7;
      color: white !important;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin-top: 15px;
      font-weight: bold;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${baseURL}/img/logo.png" alt="Крымский Вайшнавский Фестиваль" class="logo">
      <h1>Спасибо за регистрацию на сайте Крымского Вайшнавского Фестиваля</h1>
    </div>
    <div class="content">
      <p>Здравствуйте, ${fullName}!</p>
      <p>Благодарим вас за регистрацию на сайте Крымского Вайшнавского Фестиваля. Для завершения регистрации и активации вашего аккаунта, пожалуйста, нажмите на кнопку ниже:</p>
      <p style="text-align: center;">
        <a href="${verificationUrl}" class="button">Подтвердить регистрацию</a>
      </p>
      <p>Если кнопка не работает, вы можете скопировать и вставить следующую ссылку в адресную строку вашего браузера:</p>
      <p>${verificationUrl}</p>
      <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
    </div>
    <div class="footer">
      <p>С уважением, команда Крымского Вайшнавского Фестиваля</p>
      <p>© ${new Date().getFullYear()} Крымский Вайшнавский Фестиваль. Все права защищены.</p>
    </div>
  </div>
</body>
</html>
  `;
} 