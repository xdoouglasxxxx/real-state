/* Contexto de autenticação — stub local.
   O site é público (requiresAuth: false); este contexto existe para
   compatibilidade com componentes que esperam useAuth(). */
import { createContext, useContext } from "react";

const AuthContext = createContext({ user: null, isAuthenticated: false });

export function AuthProvider({ children }) {
  return (
    <AuthContext.Provider value={{ user: null, isAuthenticated: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
