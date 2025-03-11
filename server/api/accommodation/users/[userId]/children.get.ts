import { getServerSession } from '#auth';
import { FestRegistrationChild } from '~/server/models/FestRegistrationChild';
import { User } from '~/server/models/User';
import { Festival } from '~/server/models/Festival';
import { FestRegistration } from '~/server/models/FestRegistration';
import { H3Event } from 'h3';

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Проверка авторизации
    const session = await getServerSession(event);
    if (!session) {
      return createError({
        statusCode: 401,
        message: 'Необходимо авторизоваться'
      });
    }

    // Проверка прав доступа (admin или accommodation_manager)
    const user = session.user as any;
    const userRoles = user.roles || [];
    if (!userRoles.includes('admin') && !userRoles.includes('accommodation_manager')) {
      return createError({
        statusCode: 403,
        message: 'Недостаточно прав для доступа'
      });
    }

    // Получаем ID пользователя из параметров URL
    const params = event.context.params || {};
    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return createError({
        statusCode: 400,
        message: 'Некорректный ID пользователя'
      });
    }

    // Получаем активный фестиваль
    const activeFestival = await Festival.findOne({
      where: {
        isActive: true
      }
    });

    if (!activeFestival) {
      return createError({
        statusCode: 404,
        message: 'Активный фестиваль не найден'
      });
    }

    // Получаем регистрацию пользователя на фестиваль
    const registration = await FestRegistration.findOne({
      where: {
        userId: userId,
        festivalId: activeFestival.id
      }
    });

    if (!registration) {
      return {
        children: []
      };
    }

    // Получаем детей пользователя, зарегистрированных на текущий фестиваль
    const children = await FestRegistrationChild.findAll({
      where: {
        registrationId: registration.id
      },
      include: [
        {
          model: User,
          as: 'RegisteredChild',
          attributes: ['id', 'fullName', 'birthdate', 'spiritualName']
        }
      ]
    });

    console.log(`[DEBUG] Найдено ${children.length} детей для пользователя ${userId}`);

    // Преобразуем данные для ответа
    const formattedChildren = children.map(child => {
      const childData = child.toJSON();
      const registeredChild = (childData as any).RegisteredChild || {};
      return {
        id: child.id,
        childId: registeredChild.id,
        fullName: registeredChild.fullName,
        birthdate: registeredChild.birthdate,
        spiritualName: registeredChild.spiritualName,
        needsSeparateBed: child.needsSeparateBed
      };
    });

    return {
      children: formattedChildren
    };
  } catch (error) {
    console.error('Ошибка при получении списка детей:', error);
    return createError({
      statusCode: 500,
      message: 'Ошибка сервера при получении списка детей'
    });
  }
}); 