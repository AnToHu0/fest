import { nextTick } from 'vue';

export const usePhoneInputMask = () => {
  const formatPhoneInput = (value: string) => {
    if (!value) return '';
  
    // Убираем все нецифровые символы
    let digits = value.replace(/\D/g, '');
  
    // Если номер начинается с 7 или 8, убираем эту цифру
    if (digits.startsWith('7') || digits.startsWith('8')) {
      digits = digits.substring(1);
    }
  
    if (!digits.length) return '+7';
  
    if (digits.length <= 3) {
      return `+7 (${digits}`;
    } else if (digits.length <= 6) {
      return `+7 (${digits.substring(0, 3)}) ${digits.substring(3)}`;
    } else if (digits.length <= 8) {
      return `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    } else {
      return `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`;
    }
  };

  const handlePhoneInput = (e: Event, updateValue: (value: string) => void) => {
    const input = e.target as HTMLInputElement;
    const cursorPosition = input.selectionStart;
    const oldValue = input.value;
    const newValue = formatPhoneInput(input.value);

    updateValue(newValue);

    nextTick(() => {
      if (cursorPosition !== null) {
        let newCursorPosition = cursorPosition + (newValue.length - oldValue.length);

        if (newCursorPosition > 2 && newCursorPosition < 4 && newValue.length >= 4) {
          newCursorPosition = 4;
        }

        input.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    });
  };

  return {
    formatPhoneInput,
    handlePhoneInput
  };
}; 