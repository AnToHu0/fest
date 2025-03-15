<script setup lang="ts">
import type { User } from '~/types/user';
import ChildrenTable from './ChildrenTable.vue';
import UserRolesSelect from '~/components/admin/UserRolesSelect.vue';
import { usePhoneFormat } from '~/composables/usePhoneFormat';
import { usePhoneInputMask } from '~/composables/usePhoneInputMask';

interface Props {
  userData: User;
  isAdmin?: boolean;
  isCreatingNew?: boolean;
  allowRoleManagement?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isAdmin: false,
  isCreatingNew: false,
  allowRoleManagement: false
});
const emit = defineEmits(['saved', 'cancel']);

// Разбиваем ФИО на составляющие при инициализации
const [lastName = '', firstName = '', middleName = ''] = (props.userData.fullName || '').split(' ');

const form = ref({
  lastName,
  firstName,
  middleName,
  spiritualName: props.userData.spiritualName || '',
  email: props.userData.email,
  phone: props.userData.phone || '',
  city: props.userData.city || '',
  adminNotes: props.userData.adminNotes || '',
  birthDate: props.userData.birthDate ? new Date(props.userData.birthDate).toISOString().split('T')[0] : '',
  agreeToTerms: false,
  personalDataSigned: props.userData.personalDataSigned || false,
  roles: props.userData.roles || []
});

const { formatPhoneInput, handlePhoneInput } = usePhoneInputMask();

// Инициализация телефона с маской при загрузке компонента
onMounted(() => {
  if (form.value.phone) {
    form.value.phone = formatPhoneInput(form.value.phone);
  }
});

// Вычисляемое полное имя для отправки на сервер
const fullName = computed(() => {
  return [form.value.lastName, form.value.firstName, form.value.middleName]
    .filter(Boolean)
    .join(' ')
    .trim();
});

const isLoading = ref(false);
const errorMessage = ref('');

// Добавим watch для синхронизации ролей
watch(() => props.userData.roles, (newRoles) => {
  form.value.roles = newRoles || [];
}, { immediate: true });

// Функция для открытия формы согласия в новом окне
const openPersonalDataForm = () => {
  const newWindow = window.open('', '_blank', 'width=800,height=800');
  if (newWindow) {
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Согласие на обработку персональных данных</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10px;
            font-size: 12px;
            line-height: 1.3;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 10px;
          }
          h1 {
            text-align: center;
            font-size: 16px;
            margin-bottom: 10px;
          }
          .date {
            text-align: center;
            margin-bottom: 15px;
          }
          .personal-info {
            margin: 10px 0;
            line-height: 1.5;
          }
          .underline {
            text-decoration: none;
            border-bottom: 1px solid black;
            padding-bottom: 1px;
            font-weight: bold;
          }
          ol {
            margin: 10px 0;
            padding-left: 20px;
          }
          li {
            margin-bottom: 8px;
            text-align: justify;
          }
          .signature {
            margin-top: 20px;
          }
          .print-button {
            display: block;
            margin: 10px auto;
            padding: 8px 16px;
            background-color: #4f46e5;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          @media print {
            .print-button {
              display: none;
            }
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              font-size: 10pt;
            }
            h1 {
              font-size: 14pt;
            }
            li {
              margin-bottom: 6px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <button class="print-button" onclick="window.print()">Печать</button>
          
          <h1>Согласие на обработку персональных данных</h1>
          <p class="date">г. Симферополь&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;«${new Date().getDate()}» ${new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(new Date())} ${new Date().getFullYear()} года</p>

          <p>Подписывая данный документ,</p>
          <p class="personal-info">
            Фамилия: <span class="underline">${form.value.lastName}</span><br>
            Имя: <span class="underline">${form.value.firstName}</span><br>
            Отчество: <span class="underline">${form.value.middleName}</span>
          </p>

          <p>(в дальнейшем именуемый «Участник»), действует по своей волей и в своем интересе, предоставляет свое согласие на обработку организатору вайшнавских мероприятий в Крыму гр. Мунтян Евгению Владимировичу, (в дальнейшем именуемому «Организатор») (включая получение от и/или от любых третьих лиц, с учетом требований действующего законодательства Российской Федерации) персональных данных.</p>

          <ol>
            <li>Подписывая данный документ, Участник дает согласие на обработку своих Персональных данных, принятия решений или совершения иных действий, порождающих юридические последствия в отношении Участника фестиваля или других лиц и распространяется на следующую информацию: фамилия, имя, отчество, год, месяц, дата и место рождения, адрес, семейное, социальное, имущественное положение, образование, профессия, доходы, сведения, которые характеризуют физиологические особенности человека и на основе которых можно установить его личность (биометрические персональные данные) и любая иная информация, относящаяся к личности Участника, доступная либо известная в любой конкретный момент времени ("Персональные данные"). Использование и хранение биометрических персональных данных вне информационных систем персональных данных могут осуществляться только на таких материальных носителях информации и с применением такой технологии ее хранения, которые обеспечивают защиту этих данных от неправомерного или случайного доступа к ним, уничтожения, изменения, блокирования, копирования, распространения.</li>
            <li>Подписывая данный документ, Участник дает согласие на обработку своих Персональных данных Организатором до истечения сроков хранения соответствующей информации или документов, содержащих вышеуказанную информацию, определяемых в соответствии с законодательством Российской Федерации, после чего может быть отозвано путем направления Организатору соответствующего письменного уведомления Участником, не менее чем за 3 (три) месяца до момента отзыва согласия.</li>
            <li>Подписывая данный документ, Участник дает согласие на обработку своих Персональных данных, в том числе на осуществление любых действий в отношении персональных данных Участника, которые необходимы или желаемы для организации и проведения различных культурных, религиозных и других мероприятий, включая, без ограничения: сбор, систематизацию, накопление, хранение, уточнение (обновление, изменение), использование, распространение (в том числе передача), обезличивание, блокирование, уничтожение, Персональных данных, а также осуществление любых иных действий с Персональными данными Участника фестиваля с учетом действующего законодательства.</li>
            <li>Заключая настоящее соглашение, Участник дает согласие на обработку своих Персональных данных Организатором с применением следующих основных способов (но, не ограничиваясь ими): автоматизированная обработка, обработка без использования средств автоматизации, хранение, запись на электронные носители и их хранение, составление перечней, ведение баз данных, маркировка.</li>
            <li>Подписывая данный документ, Участник также обязуется не разглашать сведения, содержащие персональные данные Организатора или прочих Участников ставшие ему известными в результате исполнения настоящего Договора. Участник предупрежден об ответственности за разглашение указанных сведений.</li>
          </ol>

          <p class="signature">Подпись ____________________</p>
        </div>
      </body>
      </html>
    `);
    newWindow.document.close();
  }
};

const handleSubmit = async (closeAfterSave = false) => {
  isLoading.value = true;
  errorMessage.value = '';

  if (props.isCreatingNew && !form.value.agreeToTerms) {
    errorMessage.value = 'Необходимо согласие на обработку персональных данных';
    isLoading.value = false;
    return;
  }

  try {
    // Определяем эндпоинт в зависимости от контекста
    let endpoint;
    
    if (props.isAdmin) {
      // Если это админ и есть id пользователя, используем эндпоинт для обновления
      if (props.userData.id) {
        endpoint = `/api/admin/users/${props.userData.id}`;
      } else {
        // Если id нет, это создание нового пользователя
        endpoint = '/api/admin/users';
      }
    } else {
      // Если не админ, используем эндпоинт для обновления профиля
      endpoint = '/api/user/profile';
    }

    const response = await $fetch(endpoint, {
      method: props.userData.id ? 'PUT' : 'POST',
      body: {
        ...form.value,
        fullName: fullName.value
      }
    });
    
    // Если это было создание нового пользователя, обновляем userData всеми данными с сервера
    if (!props.userData.id && response) {
      // Обновляем все поля userData данными из ответа сервера
      Object.assign(props.userData, response);
    }
    
    emit('saved', closeAfterSave);
  } catch (error: any) {
    console.error('Ошибка при сохранении пользователя:', error);
    errorMessage.value = error.data?.message || 'Ошибка при сохранении пользователя';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Форма пользователя -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div v-if="errorMessage" class="p-3 bg-red-50 text-red-700 border border-red-200 rounded">
        {{ errorMessage }}
      </div>

      <!-- ФИО разбито на три поля -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
          <input
            id="lastName"
            v-model="form.lastName"
            type="text"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">Имя</label>
          <input
            id="firstName"
            v-model="form.firstName"
            type="text"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label for="middleName" class="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
          <input
            id="middleName"
            v-model="form.middleName"
            type="text"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      <!-- Духовное имя и дата рождения в одной строке -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="spiritualName" class="block text-sm font-medium text-gray-700 mb-1">Духовное имя</label>
          <input
            id="spiritualName"
            v-model="form.spiritualName"
            type="text"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label for="birthDate" class="block text-sm font-medium text-gray-700 mb-1">Дата рождения</label>
          <input
            id="birthDate"
            v-model="form.birthDate"
            type="date"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      <!-- Email и телефон в одной строке -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            placeholder="+7 (___) ___-__-__"
            @input="handlePhoneInput($event, (value) => form.phone = value)"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label for="city" class="block text-sm font-medium text-gray-700 mb-1">Город</label>
        <input
          id="city"
          v-model="form.city"
          type="text"
          class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      <!-- Согласие на обработку персональных данных -->
      <div v-if="isAdmin" class="flex justify-between items-center border-t border-gray-200 pt-4">
        <div class="flex items-center">
          <input
            id="personalDataSigned"
            v-model="form.personalDataSigned"
            type="checkbox"
            class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label for="personalDataSigned" class="ml-2 text-sm font-medium text-gray-700">
            Получено согласие на обработку П.Д.
          </label>
        </div>
        <button
          type="button"
          @click="openPersonalDataForm"
          class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          <Icon name="mdi:printer" class="w-4 h-4 mr-1" />
          Печать
        </button>
      </div>

      <!-- Управление ролями (только для админов) -->
      <div v-if="isAdmin && allowRoleManagement">
        <UserRolesSelect
          :user="userData"
          @update="(roles) => userData.roles = roles"
        />
      </div>

      <!-- Поле для примечаний администратора (только для админов) -->
      <div v-if="isAdmin">
        <label for="adminNotes" class="block text-sm font-medium text-gray-700 mb-1">Примечания администратора</label>
        <textarea
          id="adminNotes"
          v-model="form.adminNotes"
          rows="4"
          class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          placeholder="Примечания видны только администраторам"
        ></textarea>
      </div>

      <!-- Согласие на обработку персональных данных (только при создании нового пользователя) -->
      <div v-if="isCreatingNew" class="mt-4">
        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="agreeToTerms"
              v-model="form.agreeToTerms"
              type="checkbox"
              class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="agreeToTerms" class="font-medium text-gray-700">Согласие на обработку персональных данных</label>
            <p class="text-gray-500">Пользователь соглашается на обработку персональных данных в соответствии с политикой конфиденциальности.</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          @click="emit('cancel')"
          class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Отмена
        </button>
        <button
          type="button"
          @click="handleSubmit(false)"
          :disabled="isLoading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <span v-if="isLoading" class="flex items-center">
            <Icon name="mdi:loading" class="animate-spin mr-2" />
            Сохранение...
          </span>
          <span v-else>Сохранить</span>
        </button>
        <button
          type="submit"
          :disabled="isLoading"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          <span v-if="isLoading" class="flex items-center">
            <Icon name="mdi:loading" class="animate-spin mr-2" />
            Сохранение...
          </span>
          <span v-else>Сохранить и закрыть</span>
        </button>
      </div>
    </form>

    <!-- Таблица детей -->
    <div v-if="userData.id" class="border-t pt-6">
      <ChildrenTable
        :userId="userData.id"
        :parentData="userData"
      />
    </div>
  </div>
</template> 