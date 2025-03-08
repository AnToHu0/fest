import { User } from "~/server/models/User";
import { getServerSession } from "#auth";

export default defineEventHandler(async (event) => {
  try {
    // Получаем сессию пользователя
    const session = await getServerSession(event);

    if (!session || !session.user) {
      throw createError({
        statusCode: 401,
        message: "Не авторизован"
      });
    }

    // Получаем email пользователя из сессии
    const userEmail = session.user.email;

    // Находим пользователя в базе данных
    if (!userEmail) {
      throw createError({
        statusCode: 400,
        message: "Email пользователя не найден в сессии"
      });
    }

    const user = await User.findOne({ where: { email: userEmail } });

    if (!user) {
      throw createError({
        statusCode: 404,
        message: "Пользователь не найден"
      });
    }

    // Получаем данные из запроса
    const body = await readBody(event);
    const { currentPassword, newPassword } = body;

    // Проверяем наличие обязательных полей
    if (!currentPassword || !newPassword) {
      throw createError({
        statusCode: 400,
        message: "Текущий и новый пароли обязательны"
      });
    }

    // Проверяем длину нового пароля
    if (newPassword.length < 8) {
      throw createError({
        statusCode: 400,
        message: "Новый пароль должен содержать не менее 8 символов"
      });
    }

    // Проверяем текущий пароль, используя метод модели
    const isPasswordValid = await user.verifyPassword(currentPassword);

    if (!isPasswordValid) {
      throw createError({
        statusCode: 400,
        message: "Неверный текущий пароль",
        data: {
          code: "INVALID_CURRENT_PASSWORD"
        }
      });
    }

    // Обновляем пароль пользователя
    // Хук beforeUpdate в модели автоматически хеширует пароль
    await user.update({ password: newPassword });

    // Возвращаем успешный ответ
    return {
      success: true,
      message: "Пароль успешно изменен"
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Ошибка при смене пароля",
      data: error.data
    });
  }
}); 