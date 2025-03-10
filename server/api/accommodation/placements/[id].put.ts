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

    // Получение ID размещения из параметров маршрута
    const id = event.context.params?.id;
    if (!id) {
      return createError({
        statusCode: 400,
        message: 'Не указан ID размещения'
      });
    }

    // Проверка существования размещения
    const placement = await FestPlacement.findByPk(id);
    if (!placement) {
      return createError({
        statusCode: 404,
        message: 'Размещение не найдено'
      });
    }

    // Получение данных из тела запроса
    const body = await readBody(event);
    const { type, datefrom, dateto, comment } = body;

    // Обновляем только те поля, которые были переданы
    const updateData: any = {};
    
    if (type !== undefined) {
      updateData.type = type;
    }
    
    if (datefrom !== undefined) {
      updateData.datefrom = datefrom ? new Date(datefrom) : null;
    }
    
    if (dateto !== undefined) {
      updateData.dateto = dateto ? new Date(dateto) : null;
    }
    
    if (comment !== undefined) {
      updateData.comment = comment;
    }

    // Проверка пересечений дат, если даты изменились
    if (updateData.datefrom !== undefined || updateData.dateto !== undefined) {
      const checkDateFrom = updateData.datefrom !== undefined ? updateData.datefrom : placement.datefrom;
      const checkDateTo = updateData.dateto !== undefined ? updateData.dateto : placement.dateto;
      
      if (checkDateFrom && checkDateTo) {
        const existingPlacements = await FestPlacement.findAll({
          where: {
            roomId: placement.roomId,
            slot: placement.slot,
            id: { [Op.ne]: id }, // Исключаем текущее размещение
            [Op.or]: [
              {
                datefrom: {
                  [Op.between]: [checkDateFrom, checkDateTo]
                }
              },
              {
                dateto: {
                  [Op.between]: [checkDateFrom, checkDateTo]
                }
              },
              {
                [Op.and]: [
                  { datefrom: { [Op.lte]: checkDateFrom } },
                  { dateto: { [Op.gte]: checkDateTo } }
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
    }

    // Обновление размещения
    await placement.update(updateData);

    // Получение обновленного размещения со связанными данными
    const updatedPlacement = await FestPlacement.findByPk(placement.id, {
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'Manager',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: FestRoom,
          attributes: ['id', 'building', 'floor', 'number', 'size']
        }
      ]
    });

    return { placement: updatedPlacement };
  } catch (error) {
    console.error('Ошибка при обновлении размещения:', error);
    return createError({
      statusCode: 500,
      message: 'Ошибка сервера при обновлении размещения'
    });
  }
}); 