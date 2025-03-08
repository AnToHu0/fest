// plugins/sequelize.js
import { defineNuxtPlugin } from '#app'
import sequelize from '~/server/database'
import models from '~/server/models'

export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    await sequelize.sync();

    return {
      provide: {
        sequelize,
        models
      }
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})