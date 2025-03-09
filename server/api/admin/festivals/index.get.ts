import { Festival } from '~/server/models/Festival';
import { FestDepartment } from '~/server/models/FestDepartment';
import { defineEventHandler, createError } from 'h3';
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
    // Получаем все фестивали с информацией о департаментах
    const festivals = await Festival.findAll({
      include: [
        {
          model: FestDepartment,
          as: 'Departments',
          through: { attributes: [] },
          attributes: ['id', 'title'] // Явно указываем, какие атрибуты нам нужны
        }
      ],
      order: [['year', 'DESC'], ['startDate', 'DESC']]
    });
    
    // Преобразуем данные в формат, понятный клиенту
    const formattedFestivals = festivals.map(festival => {
      return festival.get({ plain: true });
    });
    
    return {
      success: true,
      festivals: formattedFestivals
    };
  } catch (error: any) {
    console.error('Ошибка при получении списка фестивалей:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении списка фестивалей'
    });
  }
}); 