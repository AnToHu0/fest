import { Festival } from '~/server/models/Festival';
import { FestDepartment } from '~/server/models/FestDepartment';
import { defineEventHandler, createError, getQuery } from 'h3';
import { getServerSession } from '#auth';
import sequelize from '~/server/database';

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
    const query = getQuery(event);
    const festivalId = query.festivalId ? Number(query.festivalId) : null;

    if (!festivalId) {
      throw createError({
        statusCode: 400,
        message: 'Не указан ID фестиваля'
      });
    }

    // Получаем фестиваль с департаментами
    const festival = await Festival.findByPk(festivalId, {
      include: [
        {
          model: FestDepartment,
          as: 'Departments',
          through: { attributes: [] },
          attributes: ['id', 'title', 'joinText']
        }
      ]
    });

    if (!festival) {
      throw createError({
        statusCode: 404,
        message: 'Фестиваль не найден'
      });
    }

    // Проверяем связи в таблице fest_festival_departments
    const [results] = await sequelize.query(
      `SELECT * FROM fest_festival_departments WHERE festival_id = ${festivalId}`
    );

    return {
      success: true,
      festival: festival.get({ plain: true }),
      rawLinks: results
    };
  } catch (error: any) {
    console.error('Ошибка при получении департаментов фестиваля:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении департаментов фестиваля'
    });
  }
}); 