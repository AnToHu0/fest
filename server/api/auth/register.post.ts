import { User } from "~/server/models/User";
import { sendEmail } from "~/server/utils/mailer";
import { generateVerificationToken } from "~/server/utils/mailer";
import { generateVerificationEmail } from "~/server/email/verification";

interface RegistrationBody {
  fullName: string;
  email: string;
  password: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RegistrationBody>(event);
  const { fullName, email, password } = body;

  try {
    let user = await User.findOne({ where: { email } });

    if (user) {
      throw createError({
        statusCode: 400,
        message: "Пользователь с таким емейлом уже существует, попробуйте выполнить сброс пароля.",
      });
    }

    const emailVerificationToken = generateVerificationToken();

    user = await User.create({
      fullName,
      email,
      password,
      isActive: false,
      emailVerificationToken
    });

    const config = useRuntimeConfig();
    const baseURL = config.baseURL;
    const verificationUrl = `${baseURL}?token=${emailVerificationToken}`;

    const emailHtml = generateVerificationEmail({
      fullName: user.fullName,
      verificationToken: emailVerificationToken
    });

    await sendEmail({
      to: user.email,
      subject: "Спасибо за регистрацию на сайте Крымского Вайшнавского Фестиваля",
      html: emailHtml,
      verificationUrl: verificationUrl
    });

    return {
      message: 'Пользователь зарегистрирован. Пожалуйста, проверьте вашу электронную почту для подтверждения регистрации.',
      userId: user.id
    };
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message,
    });
  }
}); 