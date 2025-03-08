export default defineNuxtConfig({
  devtools: { enabled: true },
  plugins: ['~/plugins/sequelize.server.js'],


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

    port: process.env.PORT || '3000',

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
