import { User } from "~/server/models/User";
import { getServerSession } from "#auth";

interface ProfileUpdateBody {
  lastName: string;
  firstName: string;
  middleName: string;
  spiritualName?: string;
  birthDate?: string;
  phone?: string;
  city?: string;
}

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

    if (!userEmail) {
      throw createError({
        statusCode: 400,
        message: "Email пользователя не найден в сессии"
      });
    }

    // Находим пользователя в базе данных
    const user = await User.findOne({ where: { email: userEmail } });

    if (!user) {
      throw createError({
        statusCode: 404,
        message: "Пользователь не найден"
      });
    }

    // Получаем данные из тела запроса
    const body = await readBody<ProfileUpdateBody>(event);

    // Формируем полное имя из составляющих
    const fullName = `${body.lastName} ${body.firstName} ${body.middleName}`.trim();

    // Обновляем данные пользователя
    user.fullName = fullName;
    user.spiritualName = body.spiritualName || null;
    user.birthDate = body.birthDate ? new Date(body.birthDate) : null;
    user.phone = body.phone || null;
    user.city = body.city || null;

    // Сохраняем изменения
    await user.save();

    // Разбиваем полное имя на составляющие для ответа
    const nameParts = user.fullName.split(' ');
    const lastName = nameParts[0] || '';
    const firstName = nameParts[1] || '';
    const middleName = nameParts.slice(2).join(' ') || '';

    // Возвращаем обновленные данные пользователя
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
      city: user.city
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Ошибка при обновлении данных пользователя"
    });
  }
}); 