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

    // Разбиваем полное имя на составляющие
    const nameParts = user.fullName.split(' ');
    const lastName = nameParts[0] || '';
    const firstName = nameParts[1] || '';
    const middleName = nameParts.slice(2).join(' ') || '';

    // Возвращаем данные пользователя
    return {
      id: user.id,
      fullName: user.fullName,
      lastName,
      firstName,
      middleName,
      spiritualName: user.spiritualName,
      birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : null,
      email: user.email,
      phone: user.phone,
      city: user.city,
      personalDataSigned: user.personalDataSigned
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Ошибка при получении данных пользователя"
    });
  }
}); 