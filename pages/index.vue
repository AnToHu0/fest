<script lang="ts" setup>
const { status, data, signOut, signIn } = useAuth();
const route = useRoute();

const activeTab = ref('login');
const authMessage = ref('');
const verificationStatus = ref<{ loading: boolean, success?: boolean, message?: string, email?: string, autoLoginCountdown?: number }>({ loading: false });
const autoLoginTimer = ref(null);

onMounted(async () => {
  if (route.query.requireAuth === 'true') {
    activeTab.value = 'login';
    authMessage.value = 'Для доступа к этой странице необходимо войти в систему';
  }

  const token = route.query.token as string;
  if (token) {
    verificationStatus.value.loading = true;
    try {
      try {
        const responseData = await $fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET'
        });

        if (responseData) {
          verificationStatus.value.success = true;
          verificationStatus.value.message = responseData.message || 'Email успешно подтвержден';
          verificationStatus.value.email = responseData.email;

          navigateTo({ path: route.path, query: {} }, { replace: true });
          activeTab.value = 'login';

          if (responseData.email) {
            verificationStatus.value.autoLoginCountdown = 3;

            autoLoginTimer.value = setInterval(() => {
              verificationStatus.value.autoLoginCountdown--;

              if (verificationStatus.value.autoLoginCountdown <= 0) {
                clearInterval(autoLoginTimer.value);

                signIn('credentials', {
                  email: responseData.email,
                  password: '',
                  redirect: false,
                  callbackUrl: '/'
                }).then((result) => {
                  if (result?.error) {
                    authMessage.value = `Не удалось выполнить автоматический вход: ${result.error}`;
                  } else {
                    refreshNuxtData();
                  }
                }).catch(error => {
                  authMessage.value = 'Не удалось выполнить автоматический вход. Пожалуйста, войдите вручную.';
                });
              }
            }, 1000);
          }
        } else {
          throw new Error('Пустой ответ от сервера');
        }
      } catch (fetchError) {
        throw fetchError;
      }
    } catch (error: any) {
      verificationStatus.value.success = false;
      verificationStatus.value.message = error.data?.message || 'Ошибка подтверждения email';
    } finally {
      verificationStatus.value.loading = false;
    }
  }
});

onBeforeUnmount(() => {
  if (autoLoginTimer.value) {
    clearInterval(autoLoginTimer.value);
  }
});

function setActiveTab(tab) {
  activeTab.value = tab;
  authMessage.value = '';
}

function handleLoginSuccess() {
  refreshNuxtData();
}

function handleRegisterSuccess() {
}

async function handleLogout() {
  await signOut({ callbackUrl: '/' });
}
</script>

<template>
  <div>
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

    <div v-else>
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold mb-2">Фестиваль</h1>
        <p class="text-gray-600">Войдите или зарегистрируйтесь для доступа к системе</p>
        <p v-if="authMessage" class="text-red-500 mt-2 font-medium">{{ authMessage }}</p>
        
        <div v-if="verificationStatus.loading" class="mt-4 p-4 bg-blue-100 text-blue-700 rounded">
          Проверка подтверждения email...
        </div>
        <div v-else-if="verificationStatus.message" class="mt-4 p-4 rounded" 
          :class="verificationStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
          <p>{{ verificationStatus.message }}</p>
          <p v-if="verificationStatus.autoLoginCountdown > 0" class="mt-2 font-medium">
            Автоматический вход через {{ verificationStatus.autoLoginCountdown }} сек...
          </p>
        </div>
      </div>

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
