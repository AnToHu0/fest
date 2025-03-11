// Получение имени пользователя из размещения
export const getUserName = (placement: any) => {
  if (placement.user && placement.user.fullName) {
    return placement.user.fullName;
  } else if ((placement as any).User && (placement as any).User.fullName) {
    return (placement as any).User.fullName;
  } else if ((placement as any).user && (placement as any).user.fullName) {
    return (placement as any).user.fullName;
  }
  return 'Пользователь не указан';
};

// Интерфейс для пользователя
interface UserLike {
  fullName?: string;
  name?: string;
  surname?: string;
  spiritualName?: string;
  spiritual_name?: string;
  spiritual?: string;
  [key: string]: any;
}

export function getUserFullName(placement: any): string {
  // Проверка на null или undefined
  if (!placement) return 'Нет пользователя';
  
  let user: UserLike | null = null;
  
  // Определяем объект пользователя
  if (placement.user) {
    user = placement.user;
  } else if ((placement as any).User) {
    user = (placement as any).User;
  } else {
    return 'Нет пользователя';
  }
  
  // Проверка на null
  if (!user) return 'Нет пользователя';
  
  // Определяем имя для отображения
  const fullName = user.fullName || 
                  (user.name && user.surname ? `${user.name} ${user.surname}` : '') || 
                  'Нет имени';
  
  // Проверяем наличие духовного имени в разных возможных полях
  const spiritualName = user.spiritualName || user.spiritual_name || user.spiritual || '';
  
  // Формируем метку с духовным именем в скобках, если оно есть
  return spiritualName 
    ? `${fullName} (${spiritualName})`
    : fullName;
} 