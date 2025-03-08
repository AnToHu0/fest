export default defineNuxtRouteMiddleware((to, from) => {
  const { status } = useAuth();

  if (status.value !== "authenticated") {
    // Если пользователь пытается получить доступ к защищенной странице, перенаправляем его на главную
    // с параметром requireAuth только если он не уже на главной странице
    const query = from.path !== '/' ? { requireAuth: "true" } : {};

    return navigateTo({
      name: "index",
      query
    });
  }
}); 