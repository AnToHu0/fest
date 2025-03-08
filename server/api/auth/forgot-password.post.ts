import { User } from "~/server/models/User";
import { sendEmail } from "~/server/utils/mailer";
import { generateVerificationToken } from "~/server/utils/mailer";
import { generateResetPasswordEmail } from "~/server/email/reset-password";

interface ForgotPasswordBody {
  email: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ForgotPasswordBody>(event);
  const { email } = body;

  if (!email) {
    return {
      success: false,
      message: "Email не указан"
    };
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return {
        success: true,
        message: "Если указанный email зарегистрирован в системе, на него будет отправлена инструкция по восстановлению пароля."
      };
    }

    const resetToken = generateVerificationToken();

    user.emailVerificationToken = resetToken;
    await user.save();

    const config = useRuntimeConfig();
    const baseURL = config.baseURL;
    const resetUrl = `${baseURL}?reset=${resetToken}`;

    const emailHtml = generateResetPasswordEmail({
      fullName: user.fullName,
      resetToken: resetToken
    });

    await sendEmail({
      to: user.email,
      subject: "Восстановление пароля на сайте Крымского Вайшнавского Фестиваля",
      html: emailHtml,
      verificationUrl: resetUrl
    });

    return {
      success: true,
      message: "Инструкции по восстановлению пароля отправлены на указанный email."
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Произошла ошибка при обработке запроса."
    };
  }
}); 