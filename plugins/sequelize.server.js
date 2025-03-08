// plugins/sequelize.js
import { defineNuxtPlugin } from '#app'
import sequelize from '~/server/database'
import models from '~/server/models'
import { User } from '~/server/models/User'

export default defineNuxtPlugin(async (nuxtApp) => {
  try {
    await sequelize.authenticate();
    await User.sync({ alter: true, force: false });
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