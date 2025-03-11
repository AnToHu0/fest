import { FestPlacement } from '~/server/models/FestPlacement';
import { FestRoom } from '~/server/models/FestRoom';
import { getServerSession } from '#auth';
import { User } from '~/server/models/User';
import { FestPlacementChild } from '~/server/models/FestPlacementChild';
import { FestRegistrationChild } from '~/server/models/FestRegistrationChild';
import { Op } from 'sequelize';
import sequelize from '~/server/database';

// Интерфейс для ребенка из запроса
interface ChildRequest {
  id: number;
  childId: number;
  needsSeparateBed: boolean;
  selected: boolean;
  hasSeparatePlacement?: boolean;
  [key: string]: any;
}

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
    const { roomId, slot, userId, type, datefrom, dateto, comment, children } = body;

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

    // Проверка наличия детей, которым нужна отдельная кровать
    const childrenWithSeparateBed = (children as ChildRequest[] || []).filter(child => child.needsSeparateBed && child.selected);
    
    // Проверка доступности слотов для детей
    if (childrenWithSeparateBed.length > 0) {
      // Получаем все занятые слоты в комнате
      const occupiedSlots = await FestPlacement.findAll({
        where: {
          roomId,
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
        },
        attributes: ['slot']
      });
      
      // Получаем список занятых слотов
      const occupiedSlotNumbers = occupiedSlots.map(p => p.slot);
      
      // Добавляем текущий слот родителя
      occupiedSlotNumbers.push(slot);
      
      // Проверяем, достаточно ли свободных слотов для детей
      const availableSlots = [];
      for (let i = 1; i <= room.size; i++) {
        if (!occupiedSlotNumbers.includes(i)) {
          availableSlots.push(i);
        }
      }
      
      if (availableSlots.length < childrenWithSeparateBed.length) {
        return createError({
          statusCode: 409,
          message: 'Недостаточно мест в комнате для размещения детей'
        });
      }
    }

    // Используем транзакцию для создания размещения и связанных записей
    const result = await sequelize.transaction(async (t) => {
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
      }, { transaction: t });

      // Массив для хранения ID размещений детей
      const childPlacements: number[] = [];

      // Обработка детей, если они переданы
      if (children && children.length > 0) {
        console.log('Обработка детей при создании размещения:', JSON.stringify(children, null, 2));
        
        // Разделяем детей на тех, кто будет размещен с родителем, и тех, кому нужна отдельная кровать
        const childrenWithParent = children.filter((child: ChildRequest) => child.selected && !child.needsSeparateBed);
        const childrenNeedingSeparateBed = children.filter((child: ChildRequest) => child.selected && child.needsSeparateBed);
        
        console.log(`Обработка ${childrenWithParent.length} детей, которые будут размещены с родителем:`, JSON.stringify(childrenWithParent, null, 2));
        console.log(`Обработка ${childrenNeedingSeparateBed.length} детей, которым нужна отдельная кровать:`, JSON.stringify(childrenNeedingSeparateBed, null, 2));
        
        // Создаем связи для детей, которые будут размещены с родителем
        for (const child of childrenWithParent) {
          await FestPlacementChild.create({
            placementId: placement.id,
            childId: child.id
          }, { transaction: t });
          
          // Обновляем флаг needsSeparateBed в модели FestRegistrationChild
          if (child.childId) {
            const registrationChild = await FestRegistrationChild.findByPk(child.childId, { transaction: t });
            console.log(`Обновление флага needsSeparateBed для ребенка ${child.childId} (регистрация ${child.id}):`, {
              текущееЗначение: registrationChild?.needsSeparateBed,
              новоеЗначение: false
            });
            
            if (registrationChild && registrationChild.needsSeparateBed !== false) {
              await registrationChild.update({ needsSeparateBed: false }, { transaction: t });
              console.log(`Обновлен флаг needsSeparateBed=false для ребенка ${child.childId} (регистрация ${child.id})`);
            }
          }
        }
        
        // Обрабатываем детей, которым нужна отдельная кровать
        for (const child of childrenNeedingSeparateBed) {
          // Проверяем, есть ли уже отдельное размещение для этого ребенка
          const existingChildPlacement = await FestPlacement.findOne({
            where: {
              userId: child.childId,
              type: 'child'
            },
            transaction: t
          });
          
          if (existingChildPlacement) {
            console.log(`Ребенок ${child.childId} уже имеет отдельное размещение (ID: ${existingChildPlacement.id}), пропускаем создание нового размещения`);
            childPlacements.push(existingChildPlacement.id);
            continue;
          }
          
          // Находим свободный слот в той же комнате
          const room = await FestRoom.findByPk(roomId, { transaction: t });
          if (!room) {
            throw new Error(`Комната с ID ${roomId} не найдена`);
          }
          
          // Получаем все занятые слоты в комнате на указанные даты
          const occupiedSlots = await FestPlacement.findAll({
            where: {
              roomId: roomId,
              [Op.or]: [
                {
                  datefrom: {
                    [Op.between]: [datefrom, dateto]
                  }
                },
                {
                  dateto: {
                    [Op.between]: [datefrom, dateto]
                  }
                },
                {
                  [Op.and]: [
                    { datefrom: { [Op.lte]: datefrom } },
                    { dateto: { [Op.gte]: dateto } }
                  ]
                }
              ]
            },
            attributes: ['slot'],
            transaction: t
          });
          
          const occupiedSlotNumbers = occupiedSlots.map(p => p.slot);
          
          // Находим первый свободный слот
          let freeSlot = null;
          for (let i = 1; i <= room.size; i++) {
            if (!occupiedSlotNumbers.includes(i)) {
              freeSlot = i;
              break;
            }
          }
          
          if (freeSlot === null) {
            throw new Error(`Не удалось найти свободный слот в комнате для размещения ребенка ${child.id}`);
          }
          
          // Получаем данные родителя
          const parent = await User.findByPk(userId, { attributes: ['id', 'fullName', 'spiritualName'] });
          const parentName = parent ? 
            (parent.fullName || (parent.spiritualName ? `(${parent.spiritualName})` : `ID:${parent.id}`)) : 
            `ID:${userId}`;

          // Создаем размещение для ребенка
          const childPlacement = await FestPlacement.create({
            roomId,
            slot: freeSlot,
            userId: child.childId,
            managerId: session.user.id,
            type: 'child',
            datefrom,
            dateto,
            comment: `Ребенок родителя: ${parentName}`
          }, { transaction: t });
          
          console.log(`Создано отдельное размещение для ребенка ${child.childId} (запись ${child.id}) в комнате ${roomId}, слот ${freeSlot}`);
          
          // Обновляем флаг needsSeparateBed в модели FestRegistrationChild
          if (child.childId) {
            const registrationChild = await FestRegistrationChild.findByPk(child.childId, { transaction: t });
            console.log(`Обновление флага needsSeparateBed для ребенка ${child.id} (регистрация ${child.childId}):`, {
              текущееЗначение: registrationChild?.needsSeparateBed,
              новоеЗначение: true
            });
            
            if (registrationChild && registrationChild.needsSeparateBed !== true) {
              await registrationChild.update({ needsSeparateBed: true }, { transaction: t });
              console.log(`Обновлен флаг needsSeparateBed=true для ребенка ${child.id} (регистрация ${child.childId})`);
            }
          }
          
          // Добавляем созданное размещение в список
          childPlacements.push(childPlacement.id);
        }
      }

      // Получение всех созданных размещений со связанными данными
      const allPlacements = await FestPlacement.findAll({
        where: {
          [Op.or]: [
            { id: placement.id },
            ...(childPlacements.length ? [{ id: { [Op.in]: childPlacements } }] : [])
          ]
        },
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
          },
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
        ],
        transaction: t
      });

      return allPlacements;
    });

    return { placements: result };
  } catch (error) {
    console.error('Ошибка при создании размещения:', error);
    return createError({
      statusCode: 500,
      message: 'Ошибка сервера при создании размещения'
    });
  }
}); 