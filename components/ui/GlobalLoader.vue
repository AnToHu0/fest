<script setup lang="ts">
import { useNuxtApp } from '#app';
import Loader from '~/components/ui/Loader.vue';

const nuxtApp = useNuxtApp();
const isLoading = ref(false);

// Отслеживаем события навигации
onMounted(() => {
  nuxtApp.hook('page:start', () => {
    isLoading.value = true;
  });
  
  nuxtApp.hook('page:finish', () => {
    isLoading.value = false;
  });
  
  // Устанавливаем таймаут для сброса состояния загрузки в случае ошибки
  nuxtApp.hook('app:error', () => {
    isLoading.value = false;
  });
});
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isLoading" class="fixed inset-0 z-[9999] flex items-center justify-center bg-white bg-opacity-80 pointer-events-none">
      <Loader color="blue" size="lg" />
    </div>
  </Transition>
</template> 