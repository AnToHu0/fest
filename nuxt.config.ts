// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  plugins: [
    '~/plugins/sequelize.server.js', 
    '~/plugins/components.ts'
  ],

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/img/favicon.png' },
      ]
    }
  },

  // Включаем режим SPA
  ssr: false,

  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET,
    databasePath: process.env.DATABASE_PATH,

    port: process.env.PORT || '3000',

    baseURL: process.env.AUTH_ORIGIN || `http://localhost:${process.env.PORT || '3000'}`,

    emailHost: process.env.EMAIL_HOST,
    emailPort: process.env.EMAIL_PORT,
    emailSecure: process.env.EMAIL_SECURE,
    emailUser: process.env.EMAIL_USER,
    emailPassword: process.env.EMAIL_PASSWORD,
    emailFromName: process.env.EMAIL_FROM_NAME || 'Крымский Вайшнавский Фестиваль',
    emailFromAddress: process.env.EMAIL_FROM_ADDRESS,
  },

  modules: [
    "@nuxtjs/tailwindcss", 
    "nuxt-server-utils", 
    "@sidebase/nuxt-auth", 
    '@nuxt/devtools',
    'nuxt-icon'
  ],

  auth: {
    baseURL: process.env.AUTH_ORIGIN || `http://localhost:${process.env.PORT || '3000'}`,
    provider: {
      type: "authjs",
    },
  },
});
