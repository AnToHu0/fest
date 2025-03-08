import { User } from "~/server/models/User";

interface RegistrationBody {
  fullName: string;
  email: string;
  password: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RegistrationBody>(event);
  const { fullName, email, password } = body;

  try {
    let user = await User.findOne({ where: { email } });

    if (user) {
      throw createError({
        statusCode: 400,
        message: "Пользователь с таким емейлом уже существует, попробуйте выполнить сброс пароля.",
      });
    }

    user = await User.create({ fullName, email, password });

    return { message: 'Пользователь зарегистрирован', userId: user.id };
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message,
    });
  }
}); 