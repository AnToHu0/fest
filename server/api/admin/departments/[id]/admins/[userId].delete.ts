import { FestDepartment } from '~/server/models/FestDepartment';
import { FestDepartmentAdmin } from '~/server/models/FestDepartmentAdmin';
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

    // Получаем ID департамента и пользователя из параметров запроса
    const departmentId = parseInt(event.context.params?.id || '0', 10);
    const userId = parseInt(event.context.params?.userId || '0', 10);
    
    if (!departmentId || !userId) {
      throw createError({
        statusCode: 400,
        message: 'ID департамента и пользователя обязательны'
      });
    }

    // Находим департамент по ID
    const department = await FestDepartment.findByPk(departmentId);
    if (!department) {
      throw createError({
        statusCode: 404,
        message: 'Департамент не найден'
      });
    }

    // Находим запись администратора
    const admin = await FestDepartmentAdmin.findOne({
      where: {
        departmentId: departmentId,
        userId: userId
      }
    });

    if (!admin) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не является администратором этого департамента'
      });
    }

    // Удаляем запись администратора
    await admin.destroy();

    return { success: true, message: 'Администратор успешно удален из департамента' };
  } catch (error: any) {
    console.error('Ошибка при удалении администратора департамента:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при удалении администратора департамента'
    });
  }
}); 