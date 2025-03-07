// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  // plugins: ['~/server/plugins/sequelize.server.js'],
  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET,
  },

  modules: ["@nuxtjs/tailwindcss", "nuxt-server-utils", "@sidebase/nuxt-auth", '@nuxt/devtools'],

  auth: {
    baseURL: process.env.AUTH_ORIGIN || 'http://localhost:3000',
    provider: {
      type: "authjs",
    },
  },
});
