import { Festival } from '~/server/models/Festival';
import { FestDepartment } from '~/server/models/FestDepartment';
import { FestRegistration } from '~/server/models/FestRegistration';
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

  // Проверяем роль пользователя
  if (!session.user.roles?.includes('user')) {
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
          attributes: ['id', 'title', 'joinText']
        }
      ],
      order: [['year', 'DESC'], ['startDate', 'DESC']]
    });
    
    // Получаем регистрации пользователя на фестивали
    const userRegistrations = await FestRegistration.findAll({
      where: {
        userId: session.user.id
      },
      attributes: ['festivalId']
    });
    
    // Создаем множество ID фестивалей, на которые зарегистрирован пользователь
    const registeredFestivalIds = new Set(userRegistrations.map(reg => reg.festivalId));
    
    // Преобразуем данные в формат, понятный клиенту, и добавляем информацию о регистрации
    const formattedFestivals = festivals.map(festival => {
      const festivalData = festival.get({ plain: true });
      return {
        ...festivalData,
        isRegistered: registeredFestivalIds.has(festival.id)
      };
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