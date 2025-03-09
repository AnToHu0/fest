// plugins/sequelize.js
import { defineNuxtPlugin } from '#app'
import sequelize, { initDatabase } from '~/server/database'
import models from '~/server/models'

export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    // Инициализируем базу данных и синхронизируем модели
    await initDatabase();
    
    return {
      provide: {
        sequelize,
        models
      }
    }
  } catch (error) {
    console.error('Ошибка в плагине Sequelize:', error);
  }
})