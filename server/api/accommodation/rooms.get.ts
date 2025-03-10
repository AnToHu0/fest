import { FestRoom } from '~/server/models/FestRoom';
import { FestPlacement } from '~/server/models/FestPlacement';
import { User } from '~/server/models/User';
import { Festival } from '~/server/models/Festival';
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

    // Получение активного фестиваля и его доступных корпусов
    const activeFestival = await Festival.findOne({
      where: {
        isActive: true
      },
      attributes: ['id', 'availableBuildings', 'startDate', 'endDate']
    });

    // Получаем доступные корпуса из активного фестиваля
    let availableBuildings: number[] = [];
    if (activeFestival && activeFestival.availableBuildings) {
      try {
        // Если availableBuildings уже является массивом, используем его
        if (Array.isArray(activeFestival.availableBuildings)) {
          availableBuildings = activeFestival.availableBuildings
            .map(b => typeof b === 'string' ? parseInt(b) : b)
            .filter(b => !isNaN(b));
        } 
        // Иначе парсим JSON строку
        else {
          const buildingsStr = activeFestival.availableBuildings as unknown as string;
          const parsedBuildings = JSON.parse(buildingsStr);
          availableBuildings = Array.isArray(parsedBuildings) 
            ? parsedBuildings.map(b => typeof b === 'string' ? parseInt(b) : b).filter(b => !isNaN(b))
            : [];
        }
      } catch (e) {
        console.error('Ошибка при парсинге доступных корпусов:', e);
      }
    }

    console.log('Доступные корпуса из фестиваля:', availableBuildings);

    // Получение параметров запроса
    const query = getQuery(event);
    const building = query.building ? parseInt(query.building as string) : undefined;
    const floor = query.floor ? parseInt(query.floor as string) : undefined;
    const number = query.number ? parseInt(query.number as string) : undefined;
    const withPlacements = query.withPlacements === 'true';

    // Формирование условий фильтрации
    const where: any = {};
    if (building !== undefined) where.building = building;
    if (floor !== undefined) where.floor = floor;
    if (number !== undefined) where.number = number;

    // Если есть доступные корпуса, фильтруем по ним
    if (availableBuildings.length > 0) {
      where.building = { [Op.in]: availableBuildings };
    }

    // 1. Получение списка комнат с фильтрацией по доступным корпусам
    const rooms = await FestRoom.findAll({
      where,
      order: [
        ['building', 'ASC'],
        ['floor', 'ASC'],
        ['number', 'ASC']
      ],
      raw: true
    });

    // 2. Если нужны размещения, получаем их отдельно
    if (withPlacements && rooms.length > 0) {
      // Получаем ID всех комнат для фильтрации
      const roomIds = rooms.map(room => room.id);

      // Получаем все размещения для этих комнат (без включения пользователей)
      const placements = await FestPlacement.findAll({
        where: {
          roomId: { [Op.in]: roomIds }
        },
        raw: true
      });

      // Если есть размещения, получаем данные всех связанных пользователей
      if (placements.length > 0) {
        // Собираем ID всех пользователей и менеджеров
        const userIds = [...new Set([
          ...placements.filter(p => p.userId).map(p => p.userId),
          ...placements.filter(p => p.managerId).map(p => p.managerId)
        ])];

        // Получаем данные всех пользователей одним запросом
        const users = await User.findAll({
          where: {
            id: { [Op.in]: userIds }
          },
          attributes: ['id', 'fullName', 'email'],
          raw: true
        });

        // Создаем словарь пользователей для быстрого доступа
        const usersById = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<number, any>);

        // Добавляем данные пользователей к размещениям
        const placementsWithUsers = placements.map(placement => {
          const user = placement.userId ? usersById[placement.userId] : null;
          const manager = placement.managerId ? usersById[placement.managerId] : null;
          
          return {
            ...placement,
            user,
            manager
          };
        });

        // Группируем размещения по комнатам
        const placementsByRoom = placementsWithUsers.reduce((acc, placement) => {
          const roomId = placement.roomId;
          if (!acc[roomId]) {
            acc[roomId] = [];
          }
          acc[roomId].push(placement);
          return acc;
        }, {} as Record<number, any[]>);

        // Добавляем размещения к соответствующим комнатам
        rooms.forEach(room => {
          (room as any).placements = placementsByRoom[room.id] || [];
        });
      } else {
        // Если размещений нет, добавляем пустые массивы
        rooms.forEach(room => {
          (room as any).placements = [];
        });
      }
    }

    // Добавляем информацию о фестивале для использования на клиенте
    return { 
      rooms,
      festivalInfo: activeFestival ? {
        id: activeFestival.id,
        startDate: activeFestival.startDate,
        endDate: activeFestival.endDate,
        availableBuildings
      } : null
    };
  } catch (error) {
    console.error('Ошибка при получении списка комнат:', error);
    return createError({
      statusCode: 500,
      message: 'Ошибка сервера при получении списка комнат'
    });
  }
}); 