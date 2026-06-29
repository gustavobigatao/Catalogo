export function useAuth() {
  return {
    user: { id: 0, name: "Admin", email: "admin@exemplo.com", role: "admin" },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    logout: () => {},
    login: async () => ({ error: null }),
    refresh: async () => {},
  };
}
