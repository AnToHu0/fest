<script lang="ts" setup>
definePageMeta({
  middleware: "guest",
});

const { status, data, signOut, signIn } = useAuth();
const route = useRoute();

const activeTab = ref('login');
const authMessage = ref('');
const verificationStatus = ref<{
  loading: boolean,
  success?: boolean,
  message?: string,
  email?: string,
  autoLoginCountdown?: number
}>({ loading: false });
const autoLoginTimer = ref<ReturnType<typeof setInterval> | null>(null);
const showForgotPassword = ref(false);
const resetToken = ref('');
const formWrapperRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  if (route.query.requireAuth === 'true') {
    activeTab.value = 'login';
    authMessage.value = 'Для доступа к этой странице необходимо войти в систему';

    // Очищаем параметр requireAuth из URL
    navigateTo({ path: route.path, query: {} }, { replace: true });
  }

  const token = route.query.token as string;
  if (token) {
    verificationStatus.value.loading = true;
    try {
      try {
        const responseData = await $fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET'
        }) as any;

        if (responseData) {
          verificationStatus.value.success = true;
          verificationStatus.value.message = responseData.message || 'Email успешно подтвержден';
          verificationStatus.value.email = responseData.email;

          navigateTo({ path: route.path, query: {} }, { replace: true });
          activeTab.value = 'login';

          if (responseData.email) {
            verificationStatus.value.autoLoginCountdown = 3;

            autoLoginTimer.value = setInterval(() => {
              if (verificationStatus.value.autoLoginCountdown !== undefined) {
                verificationStatus.value.autoLoginCountdown--;

                if (verificationStatus.value.autoLoginCountdown <= 0) {
                  if (autoLoginTimer.value) {
                    clearInterval(autoLoginTimer.value as any);
                  }

                  signIn('credentials', {
                    email: responseData.email,
                    password: '',
                    redirect: false,
                    callbackUrl: '/'
                  }).then((result) => {
                    if (result?.error) {
                      console.error('Ошибка автоматического входа:', result.error);
                    } else {
                      navigateTo('/dashboard');
                    }
                  }).catch(error => {
                    authMessage.value = 'Не удалось выполнить автоматический вход. Пожалуйста, войдите вручную.';
                  });
                }
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

  const resetPasswordToken = route.query.reset as string;
  if (resetPasswordToken) {
    resetToken.value = resetPasswordToken;
    activeTab.value = 'reset-password';
    navigateTo({ path: route.path, query: {} }, { replace: true });
  }

  // Инициализация высоты формы
  nextTick(() => {
    updateFormHeight();
  });
});

onBeforeUnmount(() => {
  if (autoLoginTimer.value) {
    clearInterval(autoLoginTimer.value);
  }
});

// Функция для обновления высоты формы
function updateFormHeight() {
  if (formWrapperRef.value) {
    const activeForm = formWrapperRef.value.querySelector('.form-container');
    if (activeForm) {
      const height = activeForm.scrollHeight;
      formWrapperRef.value.style.height = `${height}px`;
    }
  }
}

function setActiveTab(tab: string) {
  if (activeTab.value === tab) return;

  activeTab.value = tab;
  authMessage.value = '';
  showForgotPassword.value = false;

  // Обновляем высоту после изменения DOM
  nextTick(() => {
    updateFormHeight();
  });
}

function handleLoginSuccess() {
  refreshNuxtData();
}

function handleRegisterSuccess() {
  // Обновляем высоту после успешной регистрации
  nextTick(() => {
    updateFormHeight();
  });
}

function handleForgotPassword(email: string) {
  showForgotPassword.value = true;
  // Обновляем высоту после переключения на форму восстановления пароля
  nextTick(() => {
    updateFormHeight();
  });
}

function handleBackToLogin() {
  showForgotPassword.value = false;
  // Обновляем высоту после возврата к форме входа
  nextTick(() => {
    updateFormHeight();
  });
}

function handleResetSuccess() {
  setTimeout(() => {
    activeTab.value = 'login';
    resetToken.value = '';
    // Обновляем высоту после переключения на форму входа
    nextTick(() => {
      updateFormHeight();
    });
  }, 3000);
}

async function handleLogout() {
  await signOut({ callbackUrl: '/' });
}
</script>

<template>
  <div class="container mx-auto px-4 max-w-6xl">
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
      <div class="text-center mb-8">
        <img src="/img/logo.png" alt="Крымский Вайшнавский Фестиваль" class="mx-auto mb-4 max-w-xs">
        <h1 class="text-2xl font-bold mb-2">Крымский Вайшнавский Фестиваль</h1>
        <p v-if="!showForgotPassword && activeTab !== 'reset-password'" class="text-gray-600">Войдите или зарегистрируйтесь для доступа к системе</p>
        <p v-if="authMessage" class="text-red-500 mt-2 font-medium">{{ authMessage }}</p>
        
        <div v-if="verificationStatus.loading" class="mt-4 p-4 bg-blue-100 text-blue-700 rounded">
          Проверка подтверждения email...
        </div>
        <div v-else-if="verificationStatus.message" class="mt-4 p-4 rounded" 
          :class="verificationStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
          <p>{{ verificationStatus.message }}</p>
          <p v-if="verificationStatus.autoLoginCountdown !== undefined && verificationStatus.autoLoginCountdown > 0" class="mt-2 font-medium">
            Автоматический вход через {{ verificationStatus.autoLoginCountdown }} сек...
          </p>
        </div>
      </div>

      <div class="relative overflow-hidden">
        <Transition name="form-scale" mode="out-in" @after-enter="updateFormHeight">
          <div v-if="activeTab === 'reset-password'" key="reset" class="max-w-3xl mx-auto form-container">
            <ResetPasswordForm 
              :token="resetToken" 
              @reset-success="handleResetSuccess"
              @error-change="updateFormHeight"
            />
          </div>
          <div v-else key="auth-forms" class="w-full">
            <div v-if="!showForgotPassword" class="flex border-b mb-4 justify-center">
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

            <div ref="formWrapperRef" class="relative overflow-hidden form-wrapper">
              <Transition name="form-slide" mode="out-in" @after-enter="updateFormHeight">
                <div v-if="activeTab === 'login'" key="login" class="max-w-md mx-auto form-container">
                  <Transition name="form-fade" mode="out-in" @after-enter="updateFormHeight">
                    <div v-if="showForgotPassword" key="forgot">
                      <ForgotPasswordForm 
                        @back-to-login="handleBackToLogin" 
                        @error-change="updateFormHeight"
                      />
                    </div>
                    <div v-else key="login-form">
                      <LoginForm 
                        @login-success="handleLoginSuccess" 
                        @forgot-password="handleForgotPassword"
                        @error-change="updateFormHeight"
                      />
                    </div>
                  </Transition>
                </div>
                <div v-else key="register" class="max-w-5xl mx-auto form-container">
                  <RegisterForm @register-success="handleRegisterSuccess" />
                </div>
              </Transition>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style>
.form-slide-enter-active,
.form-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
}

.form-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.form-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.form-fade-enter-active,
.form-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
}

.form-fade-enter-from,
.form-fade-leave-to {
  opacity: 0;
}

.form-scale-enter-active,
.form-scale-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
}

.form-scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.form-scale-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.form-wrapper {
  position: relative;
  transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 200px;
  overflow: hidden;
}

.form-container {
  width: 100%;
}
</style>
