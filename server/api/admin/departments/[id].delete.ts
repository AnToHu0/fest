import { FestDepartment } from '~/server/models/FestDepartment';
import { defineEventHandler, createError } from 'h3';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  try {
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

    // Получаем ID департамента из параметров запроса
    const id = event.context.params?.id;
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'ID департамента не указан'
      });
    }

    // Находим департамент по ID
    const department = await FestDepartment.findByPk(id);
    if (!department) {
      throw createError({
        statusCode: 404,
        message: 'Департамент не найден'
      });
    }

    // Удаляем департамент
    await department.destroy();

    return { success: true, message: 'Департамент успешно удален' };
  } catch (error: any) {
    console.error('Ошибка при удалении департамента:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при удалении департамента'
    });
  }
}); 