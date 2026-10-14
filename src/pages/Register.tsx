import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Register = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 py-8">
    <div className="w-full max-w-md px-4">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-vehipredict-blue">Zerith</h1>
        <p className="text-gray-600">Homologação privada</p>
      </div>

      <Card className="border-vehipredict-lightgray shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">Acesso por convite</CardTitle>
          <CardDescription className="text-center">
            Contas de homologação são provisionadas individualmente pela equipe responsável.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>Solicite um convite ao responsável pelo ambiente de staging.</p>
          <p>Não informe senhas ou dados de clientes neste formulário: não há cadastro público.</p>
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <a className="text-vehipredict-lightblue hover:underline" href="/zehit/login">
            Ir para o login
          </a>
        </CardFooter>
      </Card>
    </div>
  </div>
);

export default Register;