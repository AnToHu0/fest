import { H3Event, getCookie } from 'h3';
import { User } from '~/server/models/User';
import { Role } from '~/server/models/Role';
import { UserRole } from '~/server/models/UserRole';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
}

export async function getCurrentUser(event: H3Event): Promise<User | null> {
  try {
    const token = getCookie(event, 'auth_token');
    if (!token) {
      return null;
    }

    const config = useRuntimeConfig();
    const decoded = jwt.verify(token, config.authSecret) as JwtPayload;
    
    if (!decoded || !decoded.userId) {
      return null;
    }

    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Role,
          as: 'Roles',
          through: { attributes: [] }
        }
      ]
    });

    return user;
  } catch (error) {
    console.error('Ошибка при получении текущего пользователя:', error);
    return null;
  }
}

export async function checkAdminRole(event: H3Event): Promise<User | null> {
  const user = await getCurrentUser(event);
  
  if (!user) {
    return null;
  }

  // Проверяем, есть ли у пользователя роль администратора
  const isAdmin = user.Roles?.some(role => role.name === 'admin');
  
  return isAdmin ? user : null;
}

export async function checkRole(event: H3Event, roleName: string): Promise<User | null> {
  const user = await getCurrentUser(event);
  
  if (!user) {
    return null;
  }

  // Проверяем, есть ли у пользователя указанная роль
  const hasRole = user.Roles?.some(role => role.name === roleName);
  
  return hasRole ? user : null;
} 