// plugins/sequelize.js
import { defineNuxtPlugin } from '#app'
import sequelize from '~/server/database'
import models from '~/server/models'
import { User } from '~/server/models/User'
import { Role } from '~/server/models/Role'
import { UserRole } from '~/server/models/UserRole'
import initRoles from '~/server/utils/initRoles'

export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    await sequelize.authenticate();
    console.log('Соединение с базой данных установлено успешно.');

    // Синхронизируем модели с базой данных
    await User.sync();
    await Role.sync();
    await UserRole.sync();

    // Синхронизируем остальные модели
    await sequelize.sync();
    console.log('Все модели синхронизированы с базой данных.');

    // Инициализируем роли
    await initRoles();
    console.log('Роли инициализированы.');

    return {
      provide: {
        sequelize,
        models
      }
    }
  } catch (error) {
    console.error('Ошибка подключения к базе данных:', error);
  }
})