<script lang="ts" setup>
import { usePhoneFormat } from '~/composables/usePhoneFormat';
import { usePhoneInputMask } from '~/composables/usePhoneInputMask';

const form = ref({
  lastName: "",
  firstName: "",
  middleName: "",
  spiritualName: "",
  birthDate: "",
  email: "",
  phone: "",
  city: "",
  password: "",
  confirmPassword: "",
  agreeToTerms: false
});

const regError = ref('');
const successMessage = ref('');
const registrationComplete = ref(false);
const showPrivacyPolicy = ref(false);

const isLoading = ref(false);
const emit = defineEmits(['register-success']);

const { formatPhone } = usePhoneFormat();
const { formatPhoneInput, handlePhoneInput } = usePhoneInputMask();

const isFormValid = computed(() => {
  return form.value.lastName &&
    form.value.firstName &&
    form.value.middleName &&
    form.value.birthDate &&
    form.value.email &&
    form.value.phone &&
    form.value.city &&
    form.value.password &&
    form.value.password === form.value.confirmPassword &&
    form.value.password.length >= 6 &&
    form.value.agreeToTerms;
});

const getDigitsOnly = (phone: string) => {
  return phone.replace(/\D/g, '');
};

// Инициализация телефона с маской при загрузке компонента
onMounted(() => {
  if (form.value.phone) {
    form.value.phone = formatPhoneInput(form.value.phone);
  }
});

function openPrivacyPolicy() {
  showPrivacyPolicy.value = true;
}

function closePrivacyPolicy() {
  showPrivacyPolicy.value = false;
}

async function handleFormSubmit() {
  if (!isFormValid.value) {
    if (!form.value.lastName || !form.value.firstName || !form.value.middleName) {
      regError.value = 'Пожалуйста, введите фамилию, имя и отчество';
    } else if (!form.value.birthDate) {
      regError.value = 'Пожалуйста, введите дату рождения';
    } else if (!form.value.email) {
      regError.value = 'Пожалуйста, введите email';
    } else if (!form.value.phone) {
      regError.value = 'Пожалуйста, введите телефон';
    } else if (!form.value.city) {
      regError.value = 'Пожалуйста, введите город';
    } else if (!form.value.password) {
      regError.value = 'Пожалуйста, введите пароль';
    } else if (form.value.password.length < 6) {
      regError.value = 'Пароль должен содержать не менее 6 символов';
    } else if (form.value.password !== form.value.confirmPassword) {
      regError.value = 'Пароли не совпадают';
    } else if (!form.value.agreeToTerms) {
      regError.value = 'Необходимо согласиться с условиями обработки персональных данных';
    }
    return;
  }

  try {
    isLoading.value = true;
    regError.value = '';

    const registrationData = {
      lastName: form.value.lastName,
      firstName: form.value.firstName,
      middleName: form.value.middleName,
      spiritualName: form.value.spiritualName || undefined,
      birthDate: form.value.birthDate || undefined,
      email: form.value.email,
      phone: form.value.phone ? getDigitsOnly(form.value.phone) : undefined,
      city: form.value.city || undefined,
      password: form.value.password
    };

    try {
      const response = await $fetch("/api/auth/register", {
        method: "POST",
        body: registrationData,
      });

      successMessage.value = response.message;
      registrationComplete.value = true;
      emit('register-success');
    } catch (error: any) {
      regError.value = error.data?.message || 'Ошибка при регистрации';
    }
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}
</script>
<template>
  <div class="py-4">
    <div v-if="registrationComplete" class="bg-green-50 p-4 rounded-lg border border-green-200">
      <div class="text-green-700 font-semibold text-lg mb-2">Регистрация успешно завершена!</div>
      <p class="text-gray-700 mb-3">{{ successMessage }}</p>
      <div class="bg-yellow-50 p-3 rounded border border-yellow-200 text-yellow-800">
        <p class="font-medium mb-1">Что дальше?</p>
        <ol class="list-decimal list-inside leading-tight">
          <li>Проверьте вашу электронную почту ({{ form.email }})</li>
          <li>Найдите письмо с темой "Спасибо за регистрацию на сайте Крымского Вайшнавского Фестиваля"</li>
          <li>Нажмите на кнопку "Подтвердить регистрацию" в письме</li>
        </ol>
      </div>
      <p class="mt-3 text-sm text-gray-600">Если вы не получили письмо, проверьте папку "Спам" или попробуйте зарегистрироваться снова с другим email-адресом.</p>
      <div class="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
        <p><strong>Важно:</strong> Вы сможете войти в личный кабинет только после подтверждения email. После подтверждения вы будете автоматически перенаправлены в личный кабинет.</p>
      </div>
    </div>
    
    <form v-else @submit.prevent="handleFormSubmit" class="space-y-2 py-2">
      <div class="bg-blue-50 p-2 rounded-lg border border-blue-200 mb-2 text-sm">
        <p class="text-gray-700 leading-tight mb-1">Если вы уже регистрировались на этом сайте, то можете воспользоваться кнопкой "Вход". Там вам будет доступно изменение регистрационных данных.</p>
        <p class="text-gray-700 leading-tight mb-1">Если забыли пароль, то воспользуйтесь соответствующей подсказкой.</p>
        <p class="text-gray-700 leading-tight mb-1">Вы можете зарегистрировать несколько человек, например родственников. Для этого заполните и отправьте форму с данными для каждого человека.</p>
        <p class="text-gray-700 leading-tight">Регистрация детей доступна в личном кабинете после авторизации на сайте.</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <label for="lastName" class="block text-sm font-medium text-gray-700 mb-0.5 text-left">Фамилия *</label>
          <input
            id="lastName"
            v-model="form.lastName"
            class="w-full border p-1 rounded-lg text-sm"
            type="text"
            placeholder="Фамилия"
            required
          />
        </div>
        
        <div>
          <label for="firstName" class="block text-sm font-medium text-gray-700 mb-0.5 text-left">Имя *</label>
          <input
            id="firstName"
            v-model="form.firstName"
            class="w-full border p-1 rounded-lg text-sm"
            type="text"
            placeholder="Имя"
            required
          />
        </div>
        
        <div>
          <label for="middleName" class="block text-sm font-medium text-gray-700 mb-0.5 text-left">Отчество *</label>
          <input
            id="middleName"
            v-model="form.middleName"
            class="w-full border p-1 rounded-lg text-sm"
            type="text"
            placeholder="Отчество"
            required
          />
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <label for="spiritualName" class="block text-sm font-medium text-gray-700 mb-0.5 text-left">Духовное имя</label>
          <input
            id="spiritualName"
            v-model="form.spiritualName"
            class="w-full border p-1 rounded-lg text-sm"
            type="text"
            placeholder="Духовное имя (если есть)"
          />
        </div>
        
        <div>
          <label for="birthDate" class="block text-sm font-medium text-gray-700 mb-0.5 text-left">Дата рождения *</label>
          <input
            id="birthDate"
            v-model="form.birthDate"
            class="w-full border p-1 rounded-lg text-sm"
            type="date"
            required
          />
        </div>
        
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-0.5 text-left">Email *</label>
          <input
            id="email"
            v-model="form.email"
            class="w-full border p-1 rounded-lg text-sm"
            type="email"
            placeholder="Email"
            required
          />
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-0.5 text-left">Телефон *</label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            placeholder="+7 (___) ___-__-__"
            @input="handlePhoneInput($event, (value) => form.phone = value)"
            required
          />
        </div>
        
        <div>
          <label for="city" class="block text-sm font-medium text-gray-700 mb-0.5 text-left">Город *</label>
          <input
            id="city"
            v-model="form.city"
            class="w-full border p-1 rounded-lg text-sm"
            type="text"
            placeholder="Город"
            required
          />
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-0.5 text-left">Пароль *</label>
          <input
            id="password"
            v-model="form.password"
            class="w-full border p-1 rounded-lg text-sm"
            type="password"
            placeholder="Пароль (минимум 6 символов)"
            required
            minlength="6"
          />
        </div>
        
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-0.5 text-left">Подтверждение пароля *</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            class="w-full border p-1 rounded-lg text-sm"
            type="password"
            placeholder="Повторите пароль"
            required
          />
        </div>
      </div>
      
      <div class="flex items-start mt-1">
        <div class="flex items-center h-5">
          <input
            id="agreeToTerms"
            v-model="form.agreeToTerms"
            type="checkbox"
            class="h-4 w-4 text-blue-600 border-gray-300 rounded"
            required
          />
        </div>
        <div class="ml-3 text-sm">
          <label for="agreeToTerms" class="font-medium text-gray-700">
            Я согласен на обработку 
            <button 
              type="button" 
              class="text-blue-600 hover:text-blue-800 underline font-medium"
              @click="openPrivacyPolicy"
            >
              персональных данных
            </button>
          </label>
        </div>
      </div>
      
      <div v-if="regError" class="text-sm text-left text-red-500 mb-1">{{ regError }}</div>
      
      <button
        :disabled="isLoading || !isFormValid"
        type="submit"
        class="bg-blue-500 hover:bg-blue-600 transition-all duration-200 w-full text-blue-50 rounded-lg p-1.5 mt-1"
        :class="{
          'opacity-50 cursor-not-allowed': isLoading || !isFormValid,
        }"
      >
        {{ isLoading ? 'Регистрация...' : 'Зарегистрироваться' }}
      </button>
    </form>
    
    <PrivacyPolicyModal 
      v-if="showPrivacyPolicy" 
      @close="closePrivacyPolicy" 
    />
  </div>
</template> 