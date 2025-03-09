import { User } from "~/server/models/User";
import { sendEmail } from "~/server/utils/mailer";
import { generateVerificationEmail } from "~/server/email/verification";
import { createUserWithActivation } from "~/server/email/userActivation";

interface RegistrationBody {
  firstName: string;
  lastName: string;
  middleName: string;
  spiritualName?: string;
  birthDate?: string;
  email: string;
  phone?: string;
  city?: string;
  password: string;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<RegistrationBody>(event);

    const {
      firstName,
      lastName,
      middleName,
      spiritualName,
      birthDate,
      email,
      phone,
      city,
      password
    } = body;

    try {
      let user = await User.findOne({ where: { email } });

      if (user) {
        throw createError({
          statusCode: 400,
          message: "Пользователь с таким емейлом уже существует, попробуйте выполнить сброс пароля.",
        });
      }

      const fullName = `${lastName} ${firstName} ${middleName}`.trim();

      let cleanPhone = null;
      if (phone) {
        cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('7') || cleanPhone.startsWith('8')) {
          cleanPhone = cleanPhone.substring(1);
        }
        if (cleanPhone.length === 10) {
          cleanPhone = '+7' + cleanPhone;
        }
      }

      if (birthDate) {
        try {
          const parsedDate = new Date(birthDate);
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Невалидная дата рождения');
          }
        } catch (dateError) {
          throw new Error('Ошибка при обработке даты рождения. Пожалуйста, проверьте формат даты.');
        }
      }

      try {
        const newUser = await createUserWithActivation({
          fullName,
          spiritualName: spiritualName || null,
          email,
          phone: cleanPhone,
          city: city || null,
          password,
          birthDate: birthDate ? new Date(birthDate) : null
        });

        user = newUser;
      } catch (createError: any) {
        throw new Error(createError.message);
      }

      return {
        message: 'Пользователь зарегистрирован. Пожалуйста, проверьте вашу электронную почту для подтверждения регистрации.',
        userId: user.id
      };
    } catch (error: any) {
      throw createError({
        statusCode: 400,
        message: error.message,
      });
    }
  } catch (outerError: any) {
    throw createError({
      statusCode: 500,
      message: 'Произошла ошибка при обработке запроса: ' + outerError.message,
    });
  }
}); 