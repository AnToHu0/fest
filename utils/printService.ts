import type { Placement, Room } from '~/types/accommodation';

// Объявляем глобальный тип для window
declare global {
  interface Window {
    print: () => void;
  }
}

/**
 * Открывает окно предпросмотра для печати инфо-листов
 * @param placements Размещение или массив размещений для печати
 */
export function openPrintPreview(placements: Placement | Placement[], room?: Room) {
  // Нормализуем данные в массив
  const placementsArray = Array.isArray(placements) ? placements : [placements];
  
  // Генерируем HTML для предпросмотра
  const html = generatePrintHTML(placementsArray, room);
  
  try {
    // Открываем новое окно
    // @ts-ignore - игнорируем ошибку типа для window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      console.error('Не удалось открыть окно печати. Проверьте настройки блокировки всплывающих окон.');
      return;
    }
    
    // Записываем HTML в новое окно
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (error) {
    console.error('Ошибка при открытии окна печати:', error);
  }
}

/**
 * Генерирует HTML для предпросмотра печати
 * @param placements Массив размещений
 * @returns HTML строка
 */
function generatePrintHTML(placements: Placement[], room?: Room) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Инфо-листы для печати</title>
      <meta charset="UTF-8">
      <style>
        /* Стили для печати */
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 10px;
          background-color: #f5f5f5;
          font-size: 12px;
        }
        .print-button {
          position: fixed;
          top: 10px;
          right: 10px;
          padding: 8px 16px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          z-index: 9999;
          font-family: Arial, sans-serif;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .print-button:hover {
          background-color: #2563eb;
        }
        .print-container {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 10px;
        }
        .info-sheet {
          page-break-inside: avoid;
          background-color: white;
          border: none;
          border-bottom: 1px dotted #000;
          padding: 3mm 0;
          box-sizing: border-box;
          margin-bottom: 3mm;
        }
        h2 {
          text-align: center;
          font-size: 12pt;
          margin-top: 0;
          margin-bottom: 2mm;
          font-weight: bold;
        }
        .info-row {
          margin-bottom: 2mm;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        .label {
          font-weight: normal;
          margin-right: 3mm;
          min-width: 35mm;
        }
        .value {
          border-bottom: 1px solid #000;
          flex: 1;
          min-width: 30mm;
          padding-bottom: 1mm;
        }
        .ml-4 {
          margin-left: 5mm;
        }
        .info-note {
          margin-top: 3mm;
          font-style: italic;
          font-size: 8pt;
        }
        
        @media print {
          body {
            background-color: white;
            padding: 0;
            font-size: 12px;
          }
          .print-button {
            display: none;
          }
          .print-container {
            padding: 0;
            gap: 0;
          }
          .info-sheet {
            box-shadow: none;
            margin: 0 0 3mm 0;
            page-break-inside: avoid;
            page-break-after: auto;
            border: none;
            border-bottom: 1px dotted #000;
          }
        }
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Печать
      </button>
      
      <div class="print-container">
        ${placements.map(placement => generateInfoSheetHTML(placement, room)).join('')}
      </div>
    </body>
    </html>
  `;
}

/**
 * Генерирует HTML для одного инфо-листа
 * @param placement Размещение
 * @returns HTML строка
 */
function generateInfoSheetHTML(placement: Placement, room?: Room) {
  // Получаем данные о размещении
  const roomNumber = room?.number || 'Н/Д';
  const building = room?.building || 'Н/Д';
  const userName = getUserFullName(placement);
  const birthDate = getUserBirthDate(placement);
  const startDate = formatDate(placement.datefrom);
  const endDate = formatDate(placement.dateto);
  const daysCount = calculateDays(placement.datefrom, placement.dateto);
  const personCount = getPersonCount(placement);
  
  return `
    <div class="info-sheet">
      <h2>Инфо лист</h2>
      
      <div class="info-row">
        <span class="label">№ корпуса</span>
        <span class="value">${building}</span>
        <span class="label ml-4">№ комнаты</span>
        <span class="value">${roomNumber}</span>
      </div>
      
      <div class="info-row">
        <span class="label">ФИО</span>
        <span class="value">${userName}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Дата рождения</span>
        <span class="value">${birthDate}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Дата заезда</span>
        <span class="value">${startDate}</span>
        <span class="label ml-4">Дата выезда</span>
        <span class="value">${endDate}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Количество дней</span>
        <span class="value">${daysCount}</span>
      </div>
      
      <div class="info-row">
        <span class="label">Количество человек</span>
        <span class="value">${personCount}</span>
      </div>
      
      <div class="info-note">
        *Данная информация предназначена для удобства вашего расселения. Обратитесь с ней, пожалуйста, в ВАШ КОРПУС к сотруднику базы
      </div>
    </div>
  `;
}

/**
 * Получает полное имя пользователя из размещения
 * @param placement Размещение
 * @returns Полное имя пользователя
 */
function getUserFullName(placement: Placement): string {
  let adultName = 'Н/Д';
  
  // Отладочный вывод для анализа структуры данных
  console.log('DEBUG: Анализ данных для получения имени пользователя:');
  console.log('placement.id:', placement.id);
  
  // Получаем имя взрослого
  if (placement.user) {
    console.log('placement.user доступен:', placement.user);
    if (placement.user.fullName) {
      adultName = placement.user.fullName;
      console.log('Найдено имя взрослого (placement.user.fullName):', adultName);
    }
  } else {
    // Проверяем альтернативные пути к данным пользователя
    const user = (placement as any).User;
    if (user && user.fullName) {
      adultName = user.fullName;
      console.log('Найдено имя взрослого (placement.User.fullName):', adultName);
    }
  }
  
  // Проверяем наличие детей
  let childrenArray = null;
  
  // Проверяем разные пути к массиву детей
  if ((placement as any).Children && Array.isArray((placement as any).Children)) {
    childrenArray = (placement as any).Children;
    console.log('Найден массив детей в placement.Children:', childrenArray.length);
  } else if ((placement as any).children && Array.isArray((placement as any).children)) {
    childrenArray = (placement as any).children;
    console.log('Найден массив детей в placement.children:', childrenArray.length);
  } else if (placement.user && (placement.user as any).Children && Array.isArray((placement.user as any).Children)) {
    childrenArray = (placement.user as any).Children;
    console.log('Найден массив детей в placement.user.Children:', childrenArray.length);
  } else if (placement.user && (placement.user as any).children && Array.isArray((placement.user as any).children)) {
    childrenArray = (placement.user as any).children;
    console.log('Найден массив детей в placement.user.children:', childrenArray.length);
  } else if ((placement as any).User && (placement as any).User.Children && Array.isArray((placement as any).User.Children)) {
    childrenArray = (placement as any).User.Children;
    console.log('Найден массив детей в placement.User.Children:', childrenArray.length);
  } else if ((placement as any).User && (placement as any).User.children && Array.isArray((placement as any).User.children)) {
    childrenArray = (placement as any).User.children;
    console.log('Найден массив детей в placement.User.children:', childrenArray.length);
  } else {
    console.log('Массив детей не найден');
  }
  
  if (childrenArray && childrenArray.length > 0) {
    console.log(`Найдено ${childrenArray.length} детей:`, childrenArray);
    
    // Получаем имена детей
    const childrenNames = childrenArray.map((child: any) => {
      let childName = '';
      
      // Выводим структуру объекта ребенка для отладки
      console.log('Структура объекта ребенка:', JSON.stringify(child, null, 2));
      
      // Проверяем различные пути к имени ребенка
      if (child.Child && child.Child.RegisteredChild && child.Child.RegisteredChild.fullName) {
        childName = child.Child.RegisteredChild.fullName;
        console.log('Найдено имя ребенка (Child.RegisteredChild.fullName):', childName);
      } else if (child.childData && child.childData.RegisteredChild && child.childData.RegisteredChild.fullName) {
        childName = child.childData.RegisteredChild.fullName;
        console.log('Найдено имя ребенка (childData.RegisteredChild.fullName):', childName);
      } else if (child.fullName) {
        childName = child.fullName;
        console.log('Найдено имя ребенка (fullName):', childName);
      } else if (child.name) {
        childName = child.name;
        console.log('Найдено имя ребенка (name):', childName);
      } else if (child.RegisteredChild && child.RegisteredChild.fullName) {
        childName = child.RegisteredChild.fullName;
        console.log('Найдено имя ребенка (RegisteredChild.fullName):', childName);
      } else if (child.childId) {
        // Если есть только ID ребенка
        childName = `Ребенок ID:${child.childId}`;
        console.log('Найден только ID ребенка:', child.childId);
      } else {
        childName = 'Ребенок';
        console.log('Имя ребенка не найдено, используем значение по умолчанию');
      }
      
      return `${childName} (ребенок)`;
    });
    
    // Объединяем имя взрослого и имена детей
    const result = `${adultName} + ${childrenNames.join(', ')}`;
    console.log('Итоговое имя с детьми:', result);
    return result;
  }
  
  console.log('Итоговое имя без детей:', adultName);
  return adultName;
}

/**
 * Получает дату рождения пользователя из размещения
 * @param placement Размещение
 * @returns Дата рождения в формате строки
 */
function getUserBirthDate(placement: Placement): string {
  // Отладочный вывод для анализа структуры данных
  console.log('DEBUG: Анализ данных для получения даты рождения:');
  console.log('placement.id:', placement.id);
  
  // Выводим полную структуру объекта размещения
  console.log('Все ключи объекта placement:', Object.keys(placement));
  console.log('Полная структура placement:', JSON.stringify(placement, null, 2));
  
  // Проверяем разные пути к дате рождения
  
  // 1. Проверяем стандартный путь через user
  if (placement.user) {
    console.log('placement.user доступен:', placement.user);
    console.log('placement.user.keys:', Object.keys(placement.user));
    
    // Проверяем поле birthDate
    if ((placement.user as any).birthDate) {
      console.log('Найдено placement.user.birthDate:', (placement.user as any).birthDate);
      return formatDate((placement.user as any).birthDate);
    }
    
    // Проверяем поле birthdate (с маленькой буквы)
    if ((placement.user as any).birthdate) {
      console.log('Найдено placement.user.birthdate:', (placement.user as any).birthdate);
      return formatDate((placement.user as any).birthdate);
    }
  } else {
    console.log('placement.user отсутствует');
  }
  
  // 2. Проверяем альтернативный путь через User
  const user = (placement as any).User;
  if (user) {
    console.log('placement.User доступен:', user);
    console.log('placement.User.keys:', Object.keys(user));
    
    // Проверяем поле birthDate
    if (user.birthDate) {
      console.log('Найдено placement.User.birthDate:', user.birthDate);
      return formatDate(user.birthDate);
    }
    
    // Проверяем поле birthdate (с маленькой буквы)
    if (user.birthdate) {
      console.log('Найдено placement.User.birthdate:', user.birthdate);
      return formatDate(user.birthdate);
    }
  } else {
    console.log('placement.User отсутствует');
  }
  
  // 3. Проверяем путь через searchField (может содержать дату рождения)
  if (placement.user && (placement.user as any).searchField) {
    const searchField = (placement.user as any).searchField;
    console.log('placement.user.searchField:', searchField);
    
    // Ищем дату в формате YYYY-MM-DD в searchField
    const dateMatch = searchField.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      console.log('Найдена дата в searchField:', dateMatch[0]);
      return formatDate(dateMatch[0]);
    }
  }
  
  // 4. Проверяем все поля объекта placement на наличие даты
  for (const key of Object.keys(placement)) {
    const value = (placement as any)[key];
    if (typeof value === 'string' && value.match(/\d{4}-\d{2}-\d{2}/)) {
      console.log(`Найдена возможная дата рождения в поле placement.${key}:`, value);
      return formatDate(value);
    }
    
    // Если значение - объект, проверяем его поля
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const subKey of Object.keys(value)) {
        const subValue = value[subKey];
        if (typeof subValue === 'string' && subValue.match(/\d{4}-\d{2}-\d{2}/)) {
          console.log(`Найдена возможная дата рождения в поле placement.${key}.${subKey}:`, subValue);
          return formatDate(subValue);
        }
      }
    }
  }
  
  // Если ничего не нашли
  console.log('Не удалось найти дату рождения для пользователя:', 
    placement.user ? placement.user.id : 'нет пользователя');
  
  return 'Н/Д';
}

/**
 * Форматирует дату в строку
 * @param date Дата или строка с датой
 * @returns Отформатированная дата
 */
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'Н/Д';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Н/Д';
    
    return dateObj.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return 'Н/Д';
  }
}

/**
 * Рассчитывает количество дней между датами
 * @param startDate Дата начала
 * @param endDate Дата окончания
 * @returns Количество дней
 */
function calculateDays(startDate: string | Date | null | undefined, endDate: string | Date | null | undefined): number {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Проверяем валидность дат
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  // Разница в миллисекундах
  const diffTime = Math.abs(end.getTime() - start.getTime());
  // Разница в днях
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Получает количество человек (включая детей)
 * @param placement Размещение
 * @returns Количество человек
 */
function getPersonCount(placement: Placement): number {
  // Начинаем с 1 (основной гость)
  let count = 1;
  
  // Добавляем детей, если они есть
  // Примечание: свойство children может отсутствовать в типе Placement,
  // но может присутствовать в реальных данных
  const childrenArray = (placement as any).Children || (placement as any).children;
  if (childrenArray && Array.isArray(childrenArray)) {
    count += childrenArray.length;
  }
  
  return count;
} 