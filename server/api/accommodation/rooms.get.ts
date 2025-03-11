import { FestRoom } from '~/server/models/FestRoom';
import { FestPlacement } from '~/server/models/FestPlacement';
import { User } from '~/server/models/User';
import { Festival } from '~/server/models/Festival';
import { FestPlacementChild } from '~/server/models/FestPlacementChild';
import { FestRegistrationChild } from '~/server/models/FestRegistrationChild';
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

    console.log('[DEBUG] Доступные корпуса из фестиваля:', availableBuildings);

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

    console.log(`[DEBUG] Получено ${rooms.length} комнат`);

    // 2. Если нужны размещения, получаем их отдельно
    if (withPlacements && rooms.length > 0) {
      // Получаем ID всех комнат для фильтрации
      const roomIds = rooms.map(room => room.id);

      // Получаем все размещения для этих комнат с включением детей
      const placements = await FestPlacement.findAll({
        where: {
          roomId: { [Op.in]: roomIds }
        },
        include: [
          {
            model: FestPlacementChild,
            as: 'Children',
            required: false
          }
        ]
      });

      console.log(`[DEBUG] Получено ${placements.length} размещений для ${roomIds.length} комнат`);
      
      // Проверяем структуру первого размещения (если есть)
      if (placements.length > 0) {
        const firstPlacement = placements[0];
        console.log('[DEBUG] Структура первого размещения:', {
          id: firstPlacement.id,
          roomId: firstPlacement.roomId,
          slot: firstPlacement.slot,
          hasChildren: firstPlacement.hasOwnProperty('Children'),
          childrenType: typeof firstPlacement.Children,
          isChildrenArray: Array.isArray(firstPlacement.Children),
          childrenLength: Array.isArray(firstPlacement.Children) ? firstPlacement.Children.length : 'не массив'
        });
        
        // Если есть дети, проверяем структуру первого ребенка
        if (Array.isArray(firstPlacement.Children) && firstPlacement.Children.length > 0) {
          const firstChild = firstPlacement.Children[0];
          console.log('[DEBUG] Структура первого ребенка:', {
            id: firstChild.id,
            placementId: firstChild.placementId,
            childId: firstChild.childId,
            hasChild: firstChild.hasOwnProperty('Child'),
            childType: (firstChild as any).Child ? typeof (firstChild as any).Child : 'отсутствует'
          });
        }
      }

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
          attributes: ['id', 'fullName', 'email', 'spiritualName'],
          raw: true
        });

        console.log(`[DEBUG] Получено ${users.length} пользователей из ${userIds.length} запрошенных ID`);

        // Создаем словарь пользователей для быстрого доступа
        const usersById = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<number, any>);

        // Собираем ID всех детей
        const childIds = [];
        for (const placement of placements) {
          if (placement.Children && placement.Children.length > 0) {
            console.log(`[DEBUG] Размещение ${placement.id} имеет ${placement.Children.length} детей`);
            for (const child of placement.Children) {
              childIds.push(child.childId);
            }
          }
        }

        console.log(`[DEBUG] Собрано ${childIds.length} ID детей для получения данных`);

        // Получаем данные всех детей
        let childrenData: Record<number, any> = {};
        if (childIds.length > 0) {
          const children = await FestRegistrationChild.findAll({
            where: {
              id: { [Op.in]: childIds }
            },
            include: [
              {
                model: User,
                as: 'RegisteredChild',
                attributes: ['id', 'fullName', 'birthdate', 'spiritualName']
              }
            ]
          });

          console.log(`[DEBUG] Получено ${children.length} записей детей из ${childIds.length} запрошенных ID`);
          
          // Если есть дети, проверяем структуру первого ребенка
          if (children.length > 0) {
            const firstChild = children[0];
            console.log('[DEBUG] Структура данных первого ребенка:', {
              id: firstChild.id,
              hasRegisteredChild: firstChild.hasOwnProperty('RegisteredChild'),
              registeredChildType: (firstChild as any).RegisteredChild ? typeof (firstChild as any).RegisteredChild : 'отсутствует',
              fullName: (firstChild as any).RegisteredChild ? (firstChild as any).RegisteredChild.fullName : 'нет имени'
            });
          }

          // Создаем словарь детей для быстрого доступа
          childrenData = children.reduce((acc, child) => {
            const childData = child.toJSON();
            acc[child.id] = childData;
            return acc;
          }, {} as Record<number, any>);
        }

        // Добавляем данные пользователей и детей к размещениям
        const placementsWithData = placements.map(placement => {
          const placementData = placement.toJSON();
          const user = placement.userId ? usersById[placement.userId] : null;
          const manager = placement.managerId ? usersById[placement.managerId] : null;
          
          // Добавляем данные детей
          if (placementData.Children && placementData.Children.length > 0) {
            console.log(`[DEBUG] Обрабатываем детей для размещения ${placementData.id}, количество: ${placementData.Children.length}`);
            placementData.Children = placementData.Children.map((child: any) => {
              // Используем безопасный доступ к данным
              const childData = child.childId && childrenData[child.childId] ? childrenData[child.childId] : {};
              
              // Создаем структуру, совместимую с PlacementCard
              return {
                ...child,
                childData,
                // Добавляем прямой доступ к Child для совместимости с PlacementCard
                Child: {
                  RegisteredChild: childData.RegisteredChild || {}
                }
              };
            });
          }
          
          return {
            ...placementData,
            user,
            manager
          };
        });

        // Группируем размещения по комнатам
        const placementsByRoom = placementsWithData.reduce((acc, placement) => {
          const roomId = placement.roomId;
          if (!acc[roomId]) {
            acc[roomId] = [];
          }
          acc[roomId].push(placement);
          return acc;
        }, {} as Record<number, any[]>);

        // Проверяем структуру данных для первой комнаты (если есть)
        const firstRoomId = Object.keys(placementsByRoom)[0];
        if (firstRoomId) {
          const roomId = parseInt(firstRoomId);
          const firstRoomPlacements = placementsByRoom[roomId];
          console.log(`[DEBUG] Комната ${roomId} имеет ${firstRoomPlacements.length} размещений`);
          
          if (firstRoomPlacements.length > 0) {
            const firstPlacement = firstRoomPlacements[0];
            console.log('[DEBUG] Структура первого размещения для комнаты:', {
              id: firstPlacement.id,
              hasChildren: firstPlacement.hasOwnProperty('Children'),
              childrenType: typeof firstPlacement.Children,
              isChildrenArray: Array.isArray(firstPlacement.Children),
              childrenLength: Array.isArray(firstPlacement.Children) ? firstPlacement.Children.length : 'не массив'
            });
          }
        }

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