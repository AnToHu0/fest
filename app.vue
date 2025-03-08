<script setup lang="ts">
import GlobalLoader from '~/components/ui/GlobalLoader.vue';

// Устанавливаем мета-теги для всего приложения
useHead({
  title: 'Крымский Вайшнавский Фестиваль',
  meta: [
    { name: 'description', content: 'Официальный сайт Крымского Вайшнавского Фестиваля' }
  ]
});

const { status } = useAuth();
const router = useRouter();
const route = useRoute();

onMounted(() => {
  // Если пользователь авторизован и находится на главной странице, перенаправляем его в личный кабинет
  if (status.value === 'authenticated' && route.path === '/') {
    router.push('/dashboard');
  }
});
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Teleport to="body">
      <GlobalLoader />
    </Teleport>
  </div>
</template>
