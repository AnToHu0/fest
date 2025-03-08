import { User } from "~/server/models/User";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const token = query.token as string;

    if (!token) {
      return {
        success: false,
        message: "Токен подтверждения не предоставлен"
      };
    }

    const user = await User.findOne({ where: { emailVerificationToken: token } });

    if (!user) {
      return {
        success: false,
        message: "Недействительный токен подтверждения"
      };
    }

    user.isActive = true;
    user.emailVerificationToken = null;
    await user.save();

    const updatedUser = await User.findByPk(user.id);

    const response = {
      success: true,
      message: "Email успешно подтвержден. Выполняется вход в систему...",
      email: user.email,
      userId: user.id,
      fullName: user.fullName
    };

    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Произошла ошибка при подтверждении email'
    };
  }
}); 