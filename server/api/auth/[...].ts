import { NuxtAuthHandler } from "#auth";
import CredentialsProvider from "next-auth/providers/credentials";
import models from "~/server/models";
import { User } from "~/server/models/User";

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
        const user = await User.findOne({ where: { email: credentials.email } });

        if (!user) {
          throw createError({
            statusCode: 401,
            statusMessage: "Неверный Email или пароль",
          });
        }

        const isValid = await user.verifyPassword(credentials.password);

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