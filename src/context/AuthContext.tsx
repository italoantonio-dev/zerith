import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  clearAccessToken,
  getAccessToken,
  zerithApi,
  type ZerithUser,
} from "@/lib/api";

interface AuthContextType {
  user: ZerithUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const USER_KEY = "zerith.user";
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ZerithUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser && getAccessToken()) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(USER_KEY);
        clearAccessToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await zerithApi.login(email, password);
      setUser(response.user);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo, " + response.user.name + "!",
      });
      return true;
    } catch (error) {
      toast({
        title: "Não foi possível entrar",
        description: error instanceof Error ? error.message : "Verifique a API e tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    clearAccessToken();
    navigate("/login");
    toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso." });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user && getAccessToken()),
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
