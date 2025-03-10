import { usePhoneFormat } from './usePhoneFormat';

export const usePhoneMask = () => {
  const { formatPhone } = usePhoneFormat();

  const handlePhoneInput = (e: Event, updateValue: (value: string) => void) => {
    const input = e.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    
    // Ограничиваем длину до 11 цифр
    if (value.length > 11) {
      input.value = formatPhone(value.slice(0, 11));
    } else {
      input.value = formatPhone(value);
    }
    
    // Устанавливаем курсор в конец
    const pos = input.value.length;
    input.setSelectionRange(pos, pos);
    
    // Обновляем значение в форме
    updateValue(value);
  };

  return {
    handlePhoneInput
  };
}; 