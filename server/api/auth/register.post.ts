import { User } from "~/server/models/User";
import { sendEmail } from "~/server/utils/mailer";
import { generateVerificationEmail } from "~/server/email/verification";
import bcrypt from "bcrypt";
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
    console.log('Начало обработки запроса регистрации');
    const body = await readBody<RegistrationBody>(event);
    console.log('Полученные данные:', JSON.stringify(body, null, 2));

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
      console.log('Проверка существования пользователя с email:', email);
      let user = await User.findOne({ where: { email } });

      if (user) {
        console.log('Пользователь с таким email уже существует');
        throw createError({
          statusCode: 400,
          message: "Пользователь с таким емейлом уже существует, попробуйте выполнить сброс пароля.",
        });
      }

      const fullName = `${lastName} ${firstName} ${middleName}`.trim();
      console.log('Сформированное полное имя:', fullName);

      let cleanPhone = null;
      if (phone) {
        console.log('Исходный телефон:', phone);
        cleanPhone = phone.replace(/\D/g, '');
        // Если телефон начинается с 7 или 8, убираем первую цифру и добавляем +7
        if (cleanPhone.startsWith('7') || cleanPhone.startsWith('8')) {
          cleanPhone = cleanPhone.substring(1);
        }
        // Проверяем длину номера (должно быть 10 цифр для российского номера)
        if (cleanPhone.length !== 10) {
          console.error('Невалидная длина номера телефона:', cleanPhone.length);
          console.log('Используем номер как есть');
        } else {
          cleanPhone = '+7' + cleanPhone;
        }
        console.log('Очищенный телефон:', cleanPhone);
      }

      if (birthDate) {
        console.log('Преобразование даты рождения:', birthDate);
        try {
          const parsedDate = new Date(birthDate);
          if (isNaN(parsedDate.getTime())) {
            console.error('Невалидная дата рождения:', birthDate);
            throw new Error('Невалидная дата рождения');
          }
          console.log('Преобразованная дата:', parsedDate.toISOString());
        } catch (dateError) {
          console.error('Ошибка при обработке даты рождения:', dateError);
          throw new Error('Ошибка при обработке даты рождения. Пожалуйста, проверьте формат даты.');
        }
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 10);

      // Используем общую функцию для создания пользователя и отправки письма активации
      console.log('Создание пользователя с данными:');
      console.log({
        fullName,
        spiritualName: spiritualName || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        email,
        phone: cleanPhone,
        city: city || null
      });

      try {
        const newUser = await createUserWithActivation({
          fullName,
          spiritualName: spiritualName || null,
          email,
          phone: cleanPhone,
          city: city || null,
          password: hashedPassword,
          birthDate: birthDate ? new Date(birthDate) : null
        });

        user = newUser;
        console.log('Пользователь успешно создан с ID:', user.id);
      } catch (createError: any) {
        console.error('Ошибка при создании пользователя:', createError);
        throw new Error(createError.message);
      }

      console.log('Регистрация успешно завершена');
      return {
        message: 'Пользователь зарегистрирован. Пожалуйста, проверьте вашу электронную почту для подтверждения регистрации.',
        userId: user.id
      };
    } catch (error: any) {
      console.error('Ошибка в процессе регистрации:', error);
      throw createError({
        statusCode: 400,
        message: error.message,
      });
    }
  } catch (outerError: any) {
    console.error('Критическая ошибка при обработке запроса:', outerError);
    throw createError({
      statusCode: 500,
      message: 'Произошла ошибка при обработке запроса: ' + outerError.message,
    });
  }
}); 