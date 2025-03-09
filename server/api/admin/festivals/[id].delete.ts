import { Festival } from '~/server/models/Festival';
import { FestFestivalDepartment } from '~/server/models/FestFestivalDepartment';
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
    const id = event.context.params?.id;
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Не указан ID фестиваля'
      });
    }

    // Проверяем существование фестиваля
    const festival = await Festival.findByPk(id);
    if (!festival) {
      throw createError({
        statusCode: 404,
        message: 'Фестиваль не найден'
      });
    }

    // Удаляем связи с департаментами
    await FestFestivalDepartment.destroy({
      where: {
        festival_id: festival.id
      }
    });

    // Удаляем фестиваль
    await festival.destroy();
    
    return {
      success: true,
      message: 'Фестиваль успешно удален'
    };
  } catch (error: any) {
    console.error('Ошибка при удалении фестиваля:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при удалении фестиваля'
    });
  }
}); 