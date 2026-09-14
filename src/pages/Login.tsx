import React from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
});

type LoginValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginValues) => {
    const success = await login(data.email, data.password);
    if (success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: "linear-gradient(135deg, #2A0D5B 0%, #4A148C 50%, #6A1B9A 100%)"
    }}>
      <div className="w-full max-w-md px-4">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold mb-2">
            <span style={{ color: '#FFDD00' }}>Z</span><span className="text-[#F5F5F5]">erith</span>
          </h1>
          <p className="text-lg text-[#F5F5F5] opacity-80">Inteligência operacional para frotas</p>
        </div>
        <Card className="bg-white/10 backdrop-blur-md border-none rounded-2xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-[#F5F5F5]">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center text-[#F5F5F5] opacity-80">
              Entre com suas credenciais para acessar o painel
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <FormControl>
                          <Input 
                            placeholder="seu.email@exemplo.com" 
                            className="pl-10" 
                            {...field} 
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            style={{ paddingRight: 44 }}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full text-[#4A148C] bg-white/30 hover:bg-[#4A148C] hover:text-[#F5F5F5] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#6A1B9A]"
                          style={{ height: 36, width: 36 }}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              <span className="text-[#F5F5F5] opacity-80">Esqueceu sua senha? </span>
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                }} 
                className="text-[#6A1B9A] hover:underline font-semibold"
              >
                Recuperar
              </a>
            </div>
            
            <div className="text-center text-sm">
              <span className="text-[#F5F5F5] opacity-80">Não tem uma conta? </span>
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  navigate("/register"); 
                }} 
                className="text-[#6A1B9A] hover:underline font-semibold"
              >
                Cadastre-se
              </a>
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-center text-sm text-[#F5F5F5] opacity-60">
          <p>&copy; 2026 Zerith</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
