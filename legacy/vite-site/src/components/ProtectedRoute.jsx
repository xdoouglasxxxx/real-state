/* O site é público; este componente existe para compatibilidade.
   Se ativar autenticação no futuro, troque a lógica abaixo. */
import { useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "./UserNotRegisteredError";

export default function ProtectedRoute({ children, require = false }) {
  const { isAuthenticated } = useAuth();
  if (require && !isAuthenticated) return <UserNotRegisteredError />;
  return children;
}
