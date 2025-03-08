import { Role } from './models/Role';
import sequelize from './models/database';

async function initRoles() {
  try {
    // Синхронизируем модель с базой данных
    await sequelize.sync();

    const roles = [
      {
        name: 'admin',
        description: 'Администратор системы'
      },
      {
        name: 'user',
        description: 'Обычный пользователь'
      },
      {
        name: 'department_head',
        description: 'Начальник департамента'
      },
      {
        name: 'accommodation_manager',
        description: 'Ответственный за расселение'
      },
      {
        name: 'registrar',
        description: 'Регистратор'
      }
    ];

    for (const role of roles) {
      const [createdRole, created] = await Role.findOrCreate({
        where: { name: role.name },
        defaults: role
      });
      console.log(`Роль ${role.name} ${created ? 'создана' : 'уже существует'}`);
    }

    console.log('Инициализация ролей завершена');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при инициализации ролей:', error);
    process.exit(1);
  }
}

initRoles(); 