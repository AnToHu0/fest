// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  plugins: ['~/plugins/sequelize.server.js'],

  // Настройка метаданных приложения, включая фавиконку
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/img/favicon.png' },
      ]
    }
  },

  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET,
    databasePath: process.env.DATABASE_PATH,
    // Добавляем порт в runtimeConfig, чтобы он был доступен в приложении
    port: process.env.PORT || '3000',
    // Добавляем baseURL в runtimeConfig, чтобы он был доступен в приложении
    baseURL: process.env.AUTH_ORIGIN || `http://localhost:${process.env.PORT || '3000'}`
  },

  modules: ["@nuxtjs/tailwindcss", "nuxt-server-utils", "@sidebase/nuxt-auth", '@nuxt/devtools'],

  auth: {
    baseURL: process.env.AUTH_ORIGIN || `http://localhost:${process.env.PORT || '3000'}`,
    provider: {
      type: "authjs",
    },
  },
});
