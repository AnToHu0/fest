import { NuxtAuthHandler } from "#auth";
import CredentialsProvider from "next-auth/providers/credentials";
import models from "~/server/models";
import { User } from "~/server/models/User";
import { Role } from "~/server/models/Role";

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,

  pages: {
    signIn: "/",
  },

  providers: [
    // @ts-expect-error
    CredentialsProvider.default({
      name: "credentials",
      credentials: {},
      async authorize(credentials: { email: string; password: string }) {
        try {
          const user = await User.findOne({ 
            where: { email: credentials.email },
            include: [{
              model: Role,
              through: { attributes: [] }
            }]
          });

          if (!user) {
            throw createError({
              statusCode: 401,
              statusMessage: "Неверный Email или пароль",
            });
          }

          const isAutoLogin = credentials.password === '';

          if (!isAutoLogin) {
            const isValid = await user.verifyPassword(credentials.password);

            if (!isValid) {
              throw createError({
                statusCode: 401,
                statusMessage: "Неверный Email или пароль",
              });
            }
          }

          if (!user.isActive && !isAutoLogin) {
            throw createError({
              statusCode: 401,
              statusMessage: "Ваш аккаунт не активирован. Пожалуйста, проверьте вашу электронную почту для подтверждения регистрации.",
            });
          }

          const userData = user.toJSON();
          return {
            ...userData,
            roles: userData.Roles.map((role: any) => role.name),
            password: undefined,
          };
        } catch (error) {
          console.error('Ошибка при авторизации:', error);
          throw error;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token = {
          ...token,
          ...user,
        };
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...token,
        ...session.user,
      };

      return session;
    },
  },
}); 