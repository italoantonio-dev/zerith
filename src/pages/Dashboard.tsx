import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Car, Radio, ServerCrash } from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { alertStatusColors, riskColors } from "@/data/mockData";
import { zerithApi } from "@/lib/api";

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Aguardando leitura";

const Dashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: zerithApi.dashboard,
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return <DashboardLayout><div className="p-8">Carregando dados da frota...</div></DashboardLayout>;
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ServerCrash /> API indisponível</CardTitle>
            <CardDescription>Inicie o backend com docker compose up --build e recarregue a página.</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  const riskChart = data.alertsByRisk.map((item) => ({
    name: item.riskLevel === "baixo" ? "Baixo" : item.riskLevel === "medio" ? "Médio" : "Alto",
    value: item.value,
  }));

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1333]">Bem-vindo, {user?.name}</h2>
          <p className="text-sm text-muted-foreground">
            {user?.company} · Última telemetria: {formatDate(data.lastUpdate)}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Metric title="Veículos monitorados" value={data.totalVehicles} subtitle="ativos na empresa" icon={<Car className="h-4 w-4" />} />
          <Metric title="Alertas ativos" value={data.activeAlerts} subtitle="necessitam atenção" icon={<AlertTriangle className="h-4 w-4" />} />
          <Metric title="Veículos críticos" value={data.criticalVehicles} subtitle="com risco alto" icon={<AlertTriangle className="h-4 w-4 text-red-600" />} />
          <Metric title="Cobertura de telemetria" value={data.telemetryCoveragePercent + "%"} subtitle="veículos online nas últimas 24h" icon={<Radio className="h-4 w-4" />} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Temperatura média</CardTitle>
              <CardDescription>Leituras reais recebidas nos últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.temperatureData}>
                  <XAxis dataKey="date" />
                  <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#4A148C" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas por risco</CardTitle>
              <CardDescription>Distribuição atual gerada pelas regras do backend</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskChart}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4A148C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alertas recentes</CardTitle>
            <CardDescription>Eventos criados a partir das leituras recebidas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Componente</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentAlerts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Envie uma leitura crítica para gerar o primeiro alerta.</TableCell></TableRow>
                ) : data.recentAlerts.map((alert, index) => (
                  <TableRow key={alert.vehicleId + alert.date + index}>
                    <TableCell className="font-medium">{alert.vehicleId}</TableCell>
                    <TableCell>{alert.component}</TableCell>
                    <TableCell><span className={"rounded-full px-2 py-1 text-xs " + riskColors[alert.riskLevel]}>{alert.riskLevel}</span></TableCell>
                    <TableCell><span className={"rounded-full px-2 py-1 text-xs " + alertStatusColors[alert.status]}>{alert.status}</span></TableCell>
                    <TableCell>{formatDate(alert.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const Metric = ({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle: string; icon: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </CardContent>
  </Card>
);

export default Dashboard;
