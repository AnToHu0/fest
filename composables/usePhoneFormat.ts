export const usePhoneFormat = () => {
  const formatPhone = (phone: string | null): string => {
    if (!phone) return '';
    
    // Убираем все, кроме цифр
    const cleaned = phone.replace(/\D/g, '');
    
    // Форматируем по маске +7 (XXX) XXX-XX-XX
    if (cleaned.length === 11) {
      return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
    }
    
    // Если длина не 11, просто возвращаем как есть с +7
    return `+7 ${cleaned}`;
  };

  return {
    formatPhone
  };
}; 