<script setup lang="ts">
import type { User } from '~/types/user';
import ChildrenTable from '~/components/user/ChildrenTable.vue';

definePageMeta({
  middleware: "auth",
  layout: "dashboard"
});

const { data: session } = useAuth();
const user = computed(() => session.value?.user as unknown as User);
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Мои дети</h1>
    </div>

    <ChildrenTable 
      v-if="user"
      :userId="user.id" 
      :parentData="user"
    />
  </div>
</template> 