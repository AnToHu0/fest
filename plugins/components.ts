import { defineNuxtPlugin } from '#app';
import DashboardSidebar from '~/components/dashboard/Sidebar.vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('DashboardSidebar', DashboardSidebar);
}); 