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

  try {
    // Получаем активный фестиваль с информацией о департаментах
    const festival = await Festival.findOne({
      where: {
        isActive: true
      },
      include: [
        {
          model: FestDepartment,
          as: 'Departments',
          through: { attributes: [] },
          attributes: ['id', 'title', 'joinText']
        }
      ]
    });
    
    return {
      success: true,
      festival: festival ? festival.get({ plain: true }) : null
    };
  } catch (error: any) {
    console.error('Ошибка при получении активного фестиваля:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении активного фестиваля'
    });
  }
}); 