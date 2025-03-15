import { User } from '~/server/models/User';
import { Role } from '~/server/models/Role';
import { UserRole } from '~/server/models/UserRole';
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

  // Проверяем роль администратора
  if (!session.user.roles?.includes('admin') && !session.user.roles?.includes('registrar')) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав'
    });
  }

  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  try {
    // Используем транзакцию для обновления пользователя и его ролей
    await sequelize.transaction(async (t) => {
      const user = await User.findByPk(id, { transaction: t });
      
      if (!user) {
        throw createError({
          statusCode: 404,
          message: 'Пользователь не найден'
        });
      }

      // Обновляем данные пользователя
      await user.update({
        fullName: body.fullName,
        spiritualName: body.spiritualName,
        email: body.email,
        phone: body.phone,
        city: body.city,
        adminNotes: body.adminNotes,
        birthDate: body.birthDate,
        personalDataSigned: body.personalDataSigned
      }, { transaction: t });

      // Если переданы роли, обновляем их
      if (body.roles) {
        // Удаляем все текущие роли пользователя
        await UserRole.destroy({
          where: { userId: user.id },
          transaction: t
        });

        // Получаем все роли из базы
        const roles = await Role.findAll({
          where: { name: body.roles },
          transaction: t
        });

        // Добавляем новые роли
        await user.setRoles(roles, { transaction: t });
      }
    });

    return { message: 'Пользователь успешно обновлен' };
  } catch (error: any) {
    console.error('Ошибка при обновлении пользователя:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при обновлении пользователя'
    });
  }
}); 