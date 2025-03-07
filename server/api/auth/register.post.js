import models from "~/server/models";
const { User } = models

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { fullName, email, password } = body

  try {

    let user = await User.findOne({ where: { email } });

    if (user) {
      throw createError({
        statusCode: 400,
        message: "Пользователь с таким емейлом уже существует, попробуйте выполнить сброс пароля.",
      })
    }

    user = await User.create({ fullName, email, password })
    // Here you would typically send a confirmation email
    return { message: 'Пользователь зарегистрирован', userId: user.id }
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error.message,
    })
  }
});
