import { User } from "~/server/models/User";

interface ResetPasswordBody {
  token: string;
  password: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ResetPasswordBody>(event);
  const { token, password } = body;

  if (!token || !password) {
    return {
      success: false,
      message: "Токен и новый пароль обязательны"
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      message: "Пароль должен содержать не менее 6 символов"
    };
  }

  try {
    const user = await User.findOne({ where: { emailVerificationToken: token } });

    if (!user) {
      return {
        success: false,
        message: "Недействительный или истекший токен сброса пароля"
      };
    }

    user.password = password;
    user.emailVerificationToken = null;
    await user.save();

    return {
      success: true,
      message: "Пароль успешно изменен. Теперь вы можете войти в систему, используя новый пароль."
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Произошла ошибка при сбросе пароля."
    };
  }
}); 