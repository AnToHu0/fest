import { getServerSession } from '#auth';
import { FestRegistrationChild } from '~/server/models/FestRegistrationChild';
import { User } from '~/server/models/User';
import { Festival } from '~/server/models/Festival';
import { FestRegistration } from '~/server/models/FestRegistration';
import { FestPlacement } from '~/server/models/FestPlacement';
import { FestPlacementChild } from '~/server/models/FestPlacementChild';
import { H3Event } from 'h3';
import { Op } from 'sequelize';

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

    // Получаем размещение пользователя
    const userPlacement = await FestPlacement.findOne({
      where: {
        userId: userId,
        type: { [Op.ne]: 'child' } // Исключаем размещения с типом 'child'
      },
      include: [
        {
          model: FestPlacementChild,
          as: 'Children',
          include: [
            {
              model: FestRegistrationChild,
              as: 'Child',
              include: [
                {
                  model: User,
                  as: 'RegisteredChild',
                  attributes: ['id', 'fullName', 'birthdate', 'spiritualName']
                }
              ]
            }
          ]
        }
      ]
    });

    // Получаем регистрацию пользователя на фестиваль
    const registration = await FestRegistration.findOne({
      where: {
        userId: userId,
        festivalId: activeFestival.id
      }
    });

    if (!registration) {
      return {
        childrenWithParent: [],
        childrenWithSeparateBed: []
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

    // Получаем размещения детей с отдельной кроватью
    const childrenIds = children.map(child => child.id);
    const childrenPlacements = await FestPlacement.findAll({
      where: {
        type: 'child',
        userId: { [Op.in]: children.map(child => (child as any).RegisteredChild?.id).filter(Boolean) }
      }
    });

    // Получаем детей, размещенных с родителем
    const childrenWithParent = [];
    const childrenWithSeparateBed = [];

    if (userPlacement && userPlacement.Children) {
      // Дети, размещенные с родителем
      for (const placementChild of userPlacement.Children) {
        const child = children.find(c => c.id === placementChild.childId);
        if (child) {
          const childData = child.toJSON();
          const registeredChild = (childData as any).RegisteredChild || {};
          childrenWithParent.push({
            id: child.id,
            childId: registeredChild.id,
            fullName: registeredChild.fullName,
            birthdate: registeredChild.birthdate,
            spiritualName: registeredChild.spiritualName,
            needsSeparateBed: child.needsSeparateBed,
            placementChildId: placementChild.id
          });
        }
      }
    }

    // Дети с отдельной кроватью
    for (const child of children) {
      const childData = child.toJSON();
      const registeredChild = (childData as any).RegisteredChild || {};
      
      // Проверяем, есть ли у ребенка отдельное размещение
      const childPlacement = childrenPlacements.find(p => p.userId === registeredChild.id);
      
      if (childPlacement) {
        childrenWithSeparateBed.push({
          id: child.id,
          childId: registeredChild.id,
          fullName: registeredChild.fullName,
          birthdate: registeredChild.birthdate,
          spiritualName: registeredChild.spiritualName,
          needsSeparateBed: child.needsSeparateBed,
          placementId: childPlacement.id,
          roomId: childPlacement.roomId,
          slot: childPlacement.slot
        });
      }
    }

    return {
      childrenWithParent,
      childrenWithSeparateBed
    };
  } catch (error) {
    console.error('Ошибка при получении информации о размещениях детей:', error);
    return createError({
      statusCode: 500,
      message: 'Ошибка сервера при получении информации о размещениях детей'
    });
  }
}); 