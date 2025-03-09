import { FestDepartment } from '~/server/models/FestDepartment';
import { User } from '~/server/models/User';
import { FestDepartmentAdmin } from '~/server/models/FestDepartmentAdmin';
import { defineEventHandler, createError, readBody } from 'h3';
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
    const departmentId = parseInt(event.context.params?.id || '0', 10);
    if (!departmentId) {
      throw createError({
        statusCode: 400,
        message: 'ID департамента не указан или некорректен'
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

    // Получаем данные из тела запроса
    const body = await readBody(event);
    
    // Проверяем наличие обязательных полей
    if (!body.userId) {
      throw createError({
        statusCode: 400,
        message: 'ID пользователя обязателен'
      });
    }

    const userId = parseInt(body.userId, 10);
    if (isNaN(userId)) {
      throw createError({
        statusCode: 400,
        message: 'ID пользователя должен быть числом'
      });
    }

    // Проверяем существование пользователя
    const user = await User.findByPk(userId);
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      });
    }

    // Проверяем, не является ли пользователь уже администратором этого департамента
    const existingAdmin = await FestDepartmentAdmin.findOne({
      where: {
        department_id: departmentId,
        user_id: userId
      }
    });

    if (existingAdmin) {
      // Если пользователь уже администратор, просто возвращаем существующую запись
      return existingAdmin;
    }

    // Добавляем пользователя как администратора департамента
    const admin = await FestDepartmentAdmin.create({
      department_id: departmentId,
      user_id: userId
    });

    return admin;
  } catch (error: any) {
    console.error('Ошибка при добавлении администратора департамента:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при добавлении администратора департамента'
    });
  }
}); 