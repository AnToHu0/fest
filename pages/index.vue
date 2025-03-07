<script lang="ts" setup>
const { status, data, signOut } = useAuth();
const route = useRoute();

const activeTab = ref('login'); // 'login' или 'register'
const authMessage = ref('');

// Проверяем, был ли пользователь перенаправлен с защищенной страницы
onMounted(() => {
  if (route.query.requireAuth === 'true') {
    activeTab.value = 'login';
    authMessage.value = 'Для доступа к этой странице необходимо войти в систему';
  }
});

function setActiveTab(tab) {
  activeTab.value = tab;
  authMessage.value = ''; // Сбрасываем сообщение при переключении вкладок
}

function handleLoginSuccess() {
  // Обновление статуса после успешного входа
  refreshNuxtData();
}

function handleRegisterSuccess() {
  // Переключение на вкладку входа после успешной регистрации
  activeTab.value = 'login';
}

async function handleLogout() {
  await signOut({ callbackUrl: '/' });
}
</script>

<template>
  <div>
    <!-- Для авторизованных пользователей -->
    <div v-if="status === 'authenticated'">
      <h1 class="mb-4 text-xl font-bold">
        Добро пожаловать, {{ (data?.user as any)?.fullName || 'Пользователь' }}
      </h1>
      <p class="mb-4">Здесь будет ваш личный кабинет и доступ к функциям фестиваля</p>

      <div class="flex flex-col space-y-2">
        <NuxtLink 
          to="/dashboard" 
          class="bg-blue-500 hover:bg-blue-600 transition-all duration-200 text-blue-50 rounded-lg py-2 px-5 text-center"
        >
          Перейти в личный кабинет
        </NuxtLink>
        
        <button
          type="button"
          class="bg-red-500 hover:bg-red-600 transition-all duration-200 text-red-50 rounded-lg py-2 px-5"
          @click="handleLogout"
        >
          Выйти
        </button>
      </div>
    </div>

    <!-- Для неавторизованных пользователей -->
    <div v-else>
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold mb-2">Фестиваль</h1>
        <p class="text-gray-600">Войдите или зарегистрируйтесь для доступа к системе</p>
        <p v-if="authMessage" class="text-red-500 mt-2">{{ authMessage }}</p>
      </div>

      <!-- Вкладки для переключения между формами -->
      <div class="flex border-b mb-4">
        <button 
          @click="setActiveTab('login')" 
          class="py-2 px-4 font-medium"
          :class="activeTab === 'login' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'"
        >
          Вход
        </button>
        <button 
          @click="setActiveTab('register')" 
          class="py-2 px-4 font-medium"
          :class="activeTab === 'register' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'"
        >
          Регистрация
        </button>
      </div>

      <!-- Формы входа и регистрации -->
      <div v-if="activeTab === 'login'">
        <LoginForm @login-success="handleLoginSuccess" />
      </div>
      <div v-else>
        <RegisterForm @register-success="handleRegisterSuccess" />
      </div>
    </div>
  </div>
</template>

<style></style>
