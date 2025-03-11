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
  statusChanged?: boolean; // Флаг изменения статуса
  [key: string]: any;
}

// Расширяем тип FestPlacement для включения связанных данных
interface FestPlacementWithRelations extends FestPlacement {
  FestRoom?: FestRoom;
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

    // Получение ID размещения из параметров маршрута
    const id = event.context.params?.id;
    if (!id) {
      return createError({
        statusCode: 400,
        message: 'Не указан ID размещения'
      });
    }

    // Проверка существования размещения
    const placement = await FestPlacement.findByPk(id, {
      include: [
        {
          model: FestRoom,
          attributes: ['id', 'building', 'floor', 'number', 'size']
        }
      ]
    }) as FestPlacementWithRelations;
    
    if (!placement) {
      return createError({
        statusCode: 404,
        message: 'Размещение не найдено'
      });
    }

    // Получение данных из тела запроса
    const body = await readBody(event);
    const { type, datefrom, dateto, comment, children, isEditing } = body;

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

    // Используем транзакцию для обновления размещения и связанных записей
    const result = await sequelize.transaction(async (t) => {
    // Обновление размещения
      await placement.update(updateData, { transaction: t });

      // Обработка детей, если они переданы
      if (children) {
        console.log('Обработка детей при обновлении размещения:', JSON.stringify(children, null, 2));
        
        // Получаем текущие связи с детьми
        const existingChildren = await FestPlacementChild.findAll({
          where: {
            placementId: placement.id
          },
          transaction: t
        });

        // Получаем существующие размещения детей с отдельными кроватями
        // Используем поле comment для поиска связанных размещений детей
        const childrenWithSeparatePlacements = await FestPlacement.findAll({
          where: {
            type: 'child',
            comment: {
              [Op.like]: `Ребенок пользователя ${placement.userId} (родительское размещение: ${placement.id})`
            }
          },
          transaction: t
        });

        console.log(`Найдено ${existingChildren.length} существующих связей с детьми и ${childrenWithSeparatePlacements.length} размещений детей с отдельными кроватями`);

        // Удаляем все существующие связи с детьми
        for (const child of existingChildren) {
          await child.destroy({ transaction: t });
        }

        // Создаем новые связи для детей, которые будут размещены с родителем
        const childrenWithParent = (children as ChildRequest[]).filter(child => 
          child.selected && !child.needsSeparateBed
        );
        
        console.log(`Обработка ${childrenWithParent.length} детей, которые будут размещены с родителем:`, JSON.stringify(childrenWithParent, null, 2));
        
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
        const childrenNeedingSeparateBed = (children as ChildRequest[]).filter(child => 
          child.selected && child.needsSeparateBed
        );
        
        console.log(`Обработка ${childrenNeedingSeparateBed.length} детей, которым нужна отдельная кровать:`, JSON.stringify(childrenNeedingSeparateBed, null, 2));
        
        for (const child of childrenNeedingSeparateBed) {
          // Проверяем, есть ли уже отдельное размещение для этого ребенка
          const existingChildPlacement = childrenWithSeparatePlacements.find(p => p.userId === child.childId);
          
          if (existingChildPlacement) {
            console.log(`Ребенок ${child.childId} уже имеет отдельное размещение (ID: ${existingChildPlacement.id}), обновляем его`);
            
            // Обновляем существующее размещение ребенка
            await existingChildPlacement.update({
              datefrom: updateData.datefrom !== undefined ? updateData.datefrom : placement.datefrom,
              dateto: updateData.dateto !== undefined ? updateData.dateto : placement.dateto
            }, { transaction: t });
            
            continue;
          }
          
          // Проверяем, есть ли уже другое отдельное размещение для этого ребенка
          const otherChildPlacement = await FestPlacement.findOne({
            where: {
              userId: child.childId,
              type: 'child'
            },
            transaction: t
          });
          
          if (otherChildPlacement) {
            console.log(`Ребенок ${child.childId} уже имеет другое отдельное размещение (ID: ${otherChildPlacement.id}), пропускаем создание нового размещения`);
            continue;
          }
          
          // Если отдельного размещения нет, создаем его
          
          // Находим свободный слот в той же комнате
          const room = placement.FestRoom;
          if (!room) {
            console.error(`Не удалось найти комнату для размещения ребенка ${child.childId}`);
            continue;
          }
          
          // Получаем все занятые слоты в комнате на указанные даты
          const occupiedSlots = await FestPlacement.findAll({
            where: {
              roomId: room.id,
              [Op.or]: [
                {
                  datefrom: {
                    [Op.between]: [updateData.datefrom || placement.datefrom, updateData.dateto || placement.dateto]
                  }
                },
                {
                  dateto: {
                    [Op.between]: [updateData.datefrom || placement.datefrom, updateData.dateto || placement.dateto]
                  }
                },
                {
                  [Op.and]: [
                    { datefrom: { [Op.lte]: updateData.datefrom || placement.datefrom } },
                    { dateto: { [Op.gte]: updateData.dateto || placement.dateto } }
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
            console.error(`Не удалось найти свободный слот в комнате для размещения ребенка ${child.childId}`);
            continue;
          }
          
          // Получаем данные родителя
          const parent = await User.findByPk(placement.userId, { attributes: ['id', 'fullName', 'spiritualName'] });
          const parentName = parent ? 
            (parent.fullName || (parent.spiritualName ? `(${parent.spiritualName})` : `ID:${parent.id}`)) : 
            `ID:${placement.userId}`;

          // Создаем размещение для ребенка
          const childPlacement = await FestPlacement.create({
            roomId: placement.roomId,
            slot: freeSlot,
            userId: child.childId,
            managerId: placement.managerId,
            type: 'child',
            datefrom: placement.datefrom,
            dateto: placement.dateto,
            comment: `Ребенок родителя: ${parentName}`
          }, { transaction: t });
          
          console.log(`Создано отдельное размещение для ребенка ${child.childId} (запись ${child.id}) в комнате ${room.id}, слот ${freeSlot}`);
        }
        
        // Удаляем размещения детей, которые больше не нуждаются в отдельной кровати или не выбраны
        const childrenToRemovePlacement = childrenWithSeparatePlacements.filter(childPlacement => {
          const childInRequest = (children as ChildRequest[]).find(c => c.childId === childPlacement.userId);
          return !childInRequest || !childInRequest.selected || !childInRequest.needsSeparateBed;
        });
        
        console.log(`Удаление ${childrenToRemovePlacement.length} размещений детей, которые больше не нуждаются в отдельной кровати или не выбраны`);
        
        for (const childPlacement of childrenToRemovePlacement) {
          await childPlacement.destroy({ transaction: t });
          console.log(`Удалено размещение для ребенка ${childPlacement.userId}`);
        }
      }

    // Получение обновленного размещения со связанными данными
    const updatedPlacement = await FestPlacement.findByPk(placement.id, {
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

      return updatedPlacement;
    });

    return { placement: result };
  } catch (error) {
    console.error('Ошибка при обновлении размещения:', error);
    return createError({
      statusCode: 500,
      message: 'Ошибка сервера при обновлении размещения'
    });
  }
}); 