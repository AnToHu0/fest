import type { Placement } from '~/types/accommodation';

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

export function getUserFullName(placement: any): string {
  if (placement.user && placement.user.fullName) {
    return placement.user.fullName;
  } else if ((placement as any).User && (placement as any).User.fullName) {
    return (placement as any).User.fullName;
  } else if ((placement as any).user && (placement as any).user.fullName) {
    return (placement as any).user.fullName;
  }
  return 'Нет пользователя';
} 