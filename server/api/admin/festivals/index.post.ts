import { Festival } from '~/server/models/Festival';
import { FestDepartment } from '~/server/models/FestDepartment';
import { FestFestivalDepartment } from '~/server/models/FestFestivalDepartment';
import { defineEventHandler, createError, readBody } from 'h3';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  // Проверяем авторизацию
  const session = await getServerSession(event);
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Необходима авторизация'
    });
  }

  // Проверяем роль администратора
  if (!session.user.roles?.includes('admin')) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав'
    });
  }

  try {
    const body = await readBody(event);
    
    // Проверяем наличие обязательных полей
    if (!body.startDate || !body.endDate || body.year === undefined) {
      throw createError({
        statusCode: 400,
        message: 'Не заполнены обязательные поля'
      });
    }
    
    // Преобразуем значения в числа
    const year = Number(body.year);
    const adultPrice = Number(body.adultPrice || 0);
    const teenPrice = Number(body.teenPrice || 0);
    const childPrice = Number(body.childPrice || 0);
    const petPrice = Number(body.petPrice || 0);
    const carPrice = Number(body.carPrice || 0);
    
    // Проверяем, что значения полей являются корректными числами
    if (isNaN(year) || year <= 0 || 
        isNaN(adultPrice) || adultPrice < 0 ||
        isNaN(teenPrice) || teenPrice < 0 ||
        isNaN(childPrice) || childPrice < 0 ||
        isNaN(petPrice) || petPrice < 0 ||
        isNaN(carPrice) || carPrice < 0) {
      throw createError({
        statusCode: 400,
        message: 'Некорректные значения полей'
      });
    }
    
    // Создаем новый фестиваль
    const festival = await Festival.create({
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      isActive: body.isActive || false,
      availableBuildings: body.availableBuildings || [],
      announcementText: body.announcementText || '',
      year,
      adultPrice,
      teenPrice,
      childPrice,
      petPrice,
      carPrice
    });
    
    // Если указаны департаменты, связываем их с фестивалем
    if (body.departments && Array.isArray(body.departments) && body.departments.length > 0) {
      // Проверяем существование департаментов
      const departmentIds = body.departments;
      const departments = await FestDepartment.findAll({
        where: {
          id: departmentIds
        }
      });
      
      // Создаем связи между фестивалем и департаментами
      const festivalDepartments = departments.map(department => ({
        festivalId: festival.id,
        departmentId: department.id
      }));
      
      if (festivalDepartments.length > 0) {
        await FestFestivalDepartment.bulkCreate(festivalDepartments);
      }
    }
    
    return {
      success: true,
      festival
    };
  } catch (error: any) {
    console.error('Ошибка при создании фестиваля:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при создании фестиваля'
    });
  }
}); 