import { NuxtAuthHandler } from "#auth";
import CredentialsProvider from "next-auth/providers/credentials";
import models from "~/server/models";

const { User } = models

export default NuxtAuthHandler({
  secret: useRuntimeConfig().authSecret,

  pages: {
    signIn: "/login",
  },

  providers: [
    // @ts-expect-error
    CredentialsProvider.default({
      name: "credentials",
      credentials: {},
      async authorize(credentials) {

        const user = await User.findOne({ where: { email: credentials.email } });

        if (!user) {
          throw createError({
            statusCode: 401,
            statusMessage: "Неверный Email или пароль",
          });
        }

        const isValid = await user.verifyPassword(credentials.password)

        if (!isValid) {
          throw createError({
            statusCode: 401,
            statusMessage: "Неверный Email или пароль",
          });
        }

        return {
          ...user.get(),
          password: undefined,
        };
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
