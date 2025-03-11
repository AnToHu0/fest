import { FestPlacement } from '~/server/models/FestPlacement';
import { User } from '~/server/models/User';
import { FestRoom } from '~/server/models/FestRoom';
import { getServerSession } from '#auth';
import { Op } from 'sequelize';

export default defineEventHandler(async (event) => {
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

    // Получение параметров запроса
    const query = getQuery(event);
    const userId = query.userId ? parseInt(query.userId as string) : undefined;
    const status = query.status as string;
    const dateFrom = query.dateFrom as string;
    const dateTo = query.dateTo as string;

    // Формирование условий фильтрации
    const where: any = {};
    
    if (userId !== undefined) {
      where.userId = userId;
    }
    
    if (status) {
      where.type = status;
    }
    
    // Фильтрация по датам (если указаны обе даты)
    if (dateFrom && dateTo) {
      where[Op.or] = [
        {
          datefrom: {
            [Op.between]: [new Date(dateFrom), new Date(dateTo)]
          }
        },
        {
          dateto: {
            [Op.between]: [new Date(dateFrom), new Date(dateTo)]
          }
        },
        {
          [Op.and]: [
            { datefrom: { [Op.lte]: new Date(dateFrom) } },
            { dateto: { [Op.gte]: new Date(dateTo) } }
          ]
        }
      ];
    } else if (dateFrom) {
      // Если указана только начальная дата
      where[Op.or] = [
        { datefrom: { [Op.gte]: new Date(dateFrom) } },
        { dateto: { [Op.gte]: new Date(dateFrom) } }
      ];
    } else if (dateTo) {
      // Если указана только конечная дата
      where[Op.or] = [
        { datefrom: { [Op.lte]: new Date(dateTo) } },
        { dateto: { [Op.lte]: new Date(dateTo) } }
      ];
    }

    // Получение списка размещений
    const placements = await FestPlacement.findAll({
      where,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'fullName', 'email', 'spiritualName']
        },
        {
          model: User,
          as: 'Manager',
          attributes: ['id', 'fullName', 'email', 'spiritualName']
        },
        {
          model: FestRoom,
          attributes: ['id', 'building', 'floor', 'number', 'size']
        }
      ],
      order: [
        ['datefrom', 'ASC'],
        ['dateto', 'ASC']
      ]
    });

    return { placements };
  } catch (error) {
    console.error('Ошибка при получении списка размещений:', error);
    return createError({
      statusCode: 500,
      message: 'Ошибка сервера при получении списка размещений'
    });
  }
}); 