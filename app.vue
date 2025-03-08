<script setup lang="ts">
import GlobalLoader from '~/components/ui/GlobalLoader.vue';

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
    <GlobalLoader />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
