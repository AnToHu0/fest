import { User } from '~/server/models/User';
import { Role } from '~/server/models/Role';
import { UserRole } from '~/server/models/UserRole';
import { sendEmail } from '~/server/utils/mailer';
import { generateVerificationToken } from '~/server/utils/mailer';
import { generateVerificationEmail } from '~/server/email/verification';
import sequelize from '~/server/database';
import type { Transaction } from 'sequelize';

interface CreateUserParams {
  fullName: string;
  spiritualName?: string | null;
  email: string;
  phone?: string | null;
  city?: string | null;
  password: string;
  adminNotes?: string | null;
  birthDate?: Date | null;
}

/**
 * Создает нового пользователя с отправкой письма для активации
 * @param userData Данные пользователя
 * @returns Созданный пользователь
 */
export async function createUserWithActivation(userData: CreateUserParams) {
  // Проверяем, не существует ли уже пользователь с таким email
  const existingUser = await User.findOne({
    where: { email: userData.email }
  });

  if (existingUser) {
    throw new Error('Пользователь с таким email уже существует');
  }

  // Генерируем токен верификации
  const emailVerificationToken = generateVerificationToken();

  // Ищем роль user
  const userRole = await Role.findOne({ where: { name: 'user' } });
  if (!userRole) {
    throw new Error('Роль "user" не найдена в базе данных');
  }

  // Создаем нового пользователя в транзакции
  let newUser;
  try {
    const result = await sequelize.transaction(async (t: Transaction) => {
      const user = await User.create({
        fullName: userData.fullName,
        spiritualName: userData.spiritualName || null,
        email: userData.email,
        phone: userData.phone || null,
        city: userData.city || null,
        adminNotes: userData.adminNotes || null,
        birthDate: userData.birthDate || null,
        isActive: false, // Пользователь неактивен до подтверждения email
        emailVerificationToken, // Добавляем токен верификации
        parentId: null, // Создаем основного пользователя, а не ребенка
        password: userData.password
      }, { transaction: t });

      // Назначаем роль user
      await UserRole.create({
        userId: user.id,
        roleId: userRole.id
      }, { transaction: t });

      return user;
    });

    newUser = result;
  } catch (error: any) {
    console.error('Ошибка при создании пользователя:', error);
    
    if (error.name === 'SequelizeValidationError') {
      throw new Error('Ошибка валидации данных: ' + error.message);
    }
    
    throw new Error('Ошибка при создании пользователя');
  }

  // Отправляем письмо для активации учетной записи
  try {
    const config = useRuntimeConfig();
    const baseURL = config.baseURL;
    const verificationUrl = `${baseURL}?token=${emailVerificationToken}`;

    const emailHtml = generateVerificationEmail({
      fullName: newUser.fullName,
      verificationToken: emailVerificationToken
    });

    await sendEmail({
      to: newUser.email,
      subject: "Регистрация на сайте Крымского Вайшнавского Фестиваля",
      html: emailHtml,
      verificationUrl: verificationUrl
    });
  } catch (emailError: any) {
    console.error('Ошибка при отправке email:', emailError);
    // Продолжаем выполнение, так как пользователь уже создан
  }

  return newUser;
} 