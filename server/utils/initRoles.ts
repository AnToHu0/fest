import { Role } from '../models/Role';

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
}

export default initRoles; 