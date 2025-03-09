import { NuxtAuthHandler } from "#auth";
import CredentialsProvider from "next-auth/providers/credentials";
import models from "~/server/models";
import { User } from "~/server/models/User";
import { Role } from "~/server/models/Role";
import type { Session } from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";

interface CustomJWT extends NextAuthJWT {
  id: number;
  email: string;
  roles?: string[];
}

interface CustomSession extends Session {
  user: {
    id: number;
    email: string;
    roles?: string[];
  }
}

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
        token.id = Number(user.id);
        token.email = user.email;
        token.roles = user.roles;
      }
      return token as CustomJWT;
    },

    async session({ session, token }): Promise<Session> {
      try {
        // Проверяем существование пользователя в базе данных
        const user = await User.findOne({ 
          where: { email: token.email },
          include: [{
            model: Role,
            through: { attributes: [] }
          }]
        });

        // Если пользователь не найден в базе, возвращаем null для разлогина
        if (!user) {
          console.log('Пользователь не найден в базе, выполняется разлогин');
          return null as any;
        }

        const userData = user.toJSON();
        const customSession = session as CustomSession;
        customSession.user = {
          ...customSession.user,
          id: user.id,
          email: user.email,
          roles: (userData.Roles || []).map((role: any) => role.name)
        };

        return customSession;
      } catch (error) {
        console.error('Ошибка при проверке сессии:', error);
        // При ошибке также разлогиниваем пользователя
        return null as any;
      }
    },
  },
}); 