import { useRuntimeConfig } from '#imports';

interface ResetPasswordEmailParams {
  fullName: string;
  resetToken: string;
}

export function generateResetPasswordEmail({ fullName, resetToken }: ResetPasswordEmailParams): string {
  const config = useRuntimeConfig();
  const baseURL = config.baseURL;
  const resetUrl = `${baseURL}?reset=${resetToken}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Сброс пароля</title>
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
      <h1>Восстановление пароля</h1>
    </div>
    <div class="content">
      <p>Здравствуйте, ${fullName}!</p>
      <p>Мы получили запрос на сброс пароля для вашей учетной записи на сайте Крымского Вайшнавского Фестиваля. Для создания нового пароля, пожалуйста, нажмите на кнопку ниже:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Сбросить пароль</a>
      </p>
      <p>Если кнопка не работает, вы можете скопировать и вставить следующую ссылку в адресную строку вашего браузера:</p>
      <p>${resetUrl}</p>
      <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо. Ваш пароль останется прежним.</p>
      <p>Ссылка действительна в течение 24 часов.</p>
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