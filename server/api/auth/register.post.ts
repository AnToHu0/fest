import { User } from "~/server/models/User";
import { Role } from "~/server/models/Role";
import { UserRole } from "~/server/models/UserRole";
import { sendEmail } from "~/server/utils/mailer";
import { generateVerificationToken } from "~/server/utils/mailer";
import { generateVerificationEmail } from "~/server/email/verification";
import sequelize from "~/server/database";
import type { Transaction } from "sequelize";

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

      console.log('Генерация токена верификации');
      const emailVerificationToken = generateVerificationToken();

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

      // Ищем роль user до создания пользователя
      console.log('Поиск роли "user"');
      const userRole = await Role.findOne({ where: { name: 'user' } });
      if (!userRole) {
        console.error('Роль "user" не найдена в базе данных');
        throw new Error('Роль "user" не найдена в базе данных');
      }

      console.log('Создание пользователя с данными:');
      console.log({
        fullName,
        spiritualName: spiritualName || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        email,
        phone: cleanPhone,
        city: city || null,
        isActive: false,
        emailVerificationToken
      });

      try {
        // Создаем пользователя в транзакции
        const result = await sequelize.transaction(async (t: Transaction) => {
          const newUser = await User.create({
            fullName,
            spiritualName: spiritualName || null,
            birthDate: birthDate ? new Date(birthDate) : null,
            email,
            phone: cleanPhone,
            city: city || null,
            password,
            isActive: false,
            emailVerificationToken
          }, { transaction: t });

          // Назначаем роль user в той же транзакции
          await UserRole.create({
            userId: newUser.id,
            roleId: userRole.id
          }, { transaction: t });

          return newUser;
        });

        user = result;
        console.log('Пользователь успешно создан с ID:', user.id);
      } catch (createError: any) {
        console.error('Ошибка при создании пользователя:');
        if (createError.name === 'SequelizeValidationError') {
          console.error('Ошибка валидации Sequelize:');
          createError.errors.forEach((err: any) => {
            console.error(`- Поле ${err.path}: ${err.message}`);
          });
          throw new Error(`Ошибка валидации: ${createError.errors.map((err: any) => `${err.path} - ${err.message}`).join(', ')}`);
        } else if (createError.name === 'SequelizeUniqueConstraintError') {
          console.error('Ошибка уникальности:');
          createError.errors.forEach((err: any) => {
            console.error(`- Поле ${err.path}: ${err.message}`);
          });
          throw new Error(`Поле ${createError.errors[0].path} должно быть уникальным`);
        } else {
          console.error('Другая ошибка Sequelize:', createError);
          throw createError;
        }
      }

      console.log('Подготовка к отправке email');
      const config = useRuntimeConfig();
      const baseURL = config.baseURL;
      const verificationUrl = `${baseURL}?token=${emailVerificationToken}`;
      console.log('URL верификации:', verificationUrl);

      const emailHtml = generateVerificationEmail({
        fullName: user.fullName,
        verificationToken: emailVerificationToken
      });
      console.log('HTML email сгенерирован');

      try {
        await sendEmail({
          to: user.email,
          subject: "Спасибо за регистрацию на сайте Крымского Вайшнавского Фестиваля",
          html: emailHtml,
          verificationUrl: verificationUrl
        });
        console.log('Email успешно отправлен');
      } catch (emailError) {
        console.error('Ошибка при отправке email:', emailError);
        // Продолжаем выполнение, так как пользователь уже создан
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