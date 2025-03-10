export function useRoles() {
  const { data } = useAuth()
  
  const currentUser = data.value?.user

  const hasRole = (role: string): boolean => {
    const roles = (data.value?.user as any)?.roles || []
    return roles.includes(role)
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }

  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every(role => hasRole(role))
  }

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    currentUser
  }
} 