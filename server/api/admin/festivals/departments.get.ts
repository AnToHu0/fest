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
    // Получаем только активные (публичные) департаменты
    const departments = await FestDepartment.findAll({
      attributes: ['id', 'title'],
      where: {
        isPublic: true
      },
      order: [['title', 'ASC']]
    });
    
    return {
      success: true,
      departments
    };
  } catch (error: any) {
    console.error('Ошибка при получении списка департаментов:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении списка департаментов'
    });
  }
}); 