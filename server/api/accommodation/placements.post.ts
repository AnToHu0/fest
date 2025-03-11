import { FestPlacement } from '~/server/models/FestPlacement';
import { FestRoom } from '~/server/models/FestRoom';
import { getServerSession } from '#auth';
import { User } from '~/server/models/User';
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

    // Получение данных из тела запроса
    const body = await readBody(event);
    const { roomId, slot, userId, type, datefrom, dateto, comment } = body;

    // Валидация обязательных полей
    if (!roomId || slot === undefined || !userId) {
      return createError({
        statusCode: 400,
        message: 'Необходимо указать комнату, слот и пользователя'
      });
    }

    // Проверка существования комнаты
    const room = await FestRoom.findByPk(roomId);
    if (!room) {
      return createError({
        statusCode: 404,
        message: 'Комната не найдена'
      });
    }

    // Проверка существования пользователя
    const userExists = await User.findByPk(userId);
    if (!userExists) {
      return createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      });
    }

    // Проверка валидности слота
    if (slot < 1 || slot > room.size) {
      return createError({
        statusCode: 400,
        message: `Слот должен быть между 1 и ${room.size}`
      });
    }

    // Проверка доступности слота (отсутствие пересечений)
    if (datefrom && dateto) {
      const existingPlacements = await FestPlacement.findAll({
        where: {
          roomId,
          slot,
          [Op.or]: [
            {
              datefrom: {
                [Op.between]: [new Date(datefrom), new Date(dateto)]
              }
            },
            {
              dateto: {
                [Op.between]: [new Date(datefrom), new Date(dateto)]
              }
            },
            {
              [Op.and]: [
                { datefrom: { [Op.lte]: new Date(datefrom) } },
                { dateto: { [Op.gte]: new Date(dateto) } }
              ]
            }
          ]
        }
      });

      if (existingPlacements.length > 0) {
        return createError({
          statusCode: 409,
          message: 'Слот уже занят в указанные даты'
        });
      }
    }

    // Создание нового размещения
    const placement = await FestPlacement.create({
      roomId,
      slot,
      managerId: (session.user as any).id,
      userId,
      type: type || 'booked',
      datefrom: datefrom ? new Date(datefrom) : null,
      dateto: dateto ? new Date(dateto) : null,
      comment: comment || ''
    });

    // Получение созданного размещения со связанными данными
    const createdPlacement = await FestPlacement.findByPk(placement.id, {
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
      ]
    });

    return { placement: createdPlacement };
  } catch (error) {
    console.error('Ошибка при создании размещения:', error);
    return createError({
      statusCode: 500,
      message: 'Ошибка сервера при создании размещения'
    });
  }
}); 