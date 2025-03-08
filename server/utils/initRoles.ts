import Role from '../models/Role';

export async function initRoles() {
  const roles = [
    {
      name: 'user',
      description: 'Обычный пользователь'
    },
    {
      name: 'admin',
      description: 'Администратор системы'
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
    await Role.findOrCreate({
      where: { name: role.name },
      defaults: role
    });
  }

  console.log('Роли успешно инициализированы');
}

export default initRoles; 