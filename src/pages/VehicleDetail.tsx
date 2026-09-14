import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Cpu, Radio } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { alertStatusColors, riskColors, statusColors } from "@/data/mockData";
import { zerithApi } from "@/lib/api";

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Sem registro";

const VehicleDetail = () => {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const vehicleQuery = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => zerithApi.vehicle(id),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
  const telemetryQuery = useQuery({
    queryKey: ["telemetry", id],
    queryFn: () => zerithApi.telemetry(id, 14),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
  const alertsQuery = useQuery({
    queryKey: ["alerts"],
    queryFn: zerithApi.alerts,
    refetchInterval: 15_000,
  });

  if (vehicleQuery.isLoading) {
    return <DashboardLayout><div className="p-8">Carregando veículo...</div></DashboardLayout>;
  }
  if (!vehicleQuery.data || vehicleQuery.error) {
    return (
      <DashboardLayout>
        <div className="space-y-4 p-8">
          <h2 className="text-2xl font-bold">Veículo não encontrado</h2>
          <Button onClick={() => navigate("/veiculos")}>Voltar para a frota</Button>
        </div>
      </DashboardLayout>
    );
  }

  const vehicle = vehicleQuery.data;
  const readings = telemetryQuery.data ?? [];
  const vehicleAlerts = (alertsQuery.data ?? []).filter((alert) => alert.vehicleId === id);

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/veiculos")}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-[#1A1333]">{vehicle.modelo}</h2>
            <p className="text-sm text-muted-foreground">{vehicle.id} · {vehicle.placa}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Informações do veículo</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Info label="Modelo" value={vehicle.modelo} />
              <Info label="Ano" value={vehicle.ano ?? "-"} />
              <Info label="Tipo" value={vehicle.tipo} />
              <Info label="Quilometragem" value={Number(vehicle.km).toLocaleString("pt-BR") + " km"} />
              <Info label="Motorista" value={vehicle.motorista ?? "Não atribuído"} />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span className={"mt-1 inline-flex rounded-full px-2 py-1 text-xs " + statusColors[vehicle.status]}>{vehicle.status}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" /> Dispositivo</CardTitle>
              <CardDescription>Vínculo entre o veículo e o hardware de telemetria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Info label="Identificador" value={vehicle.deviceId ?? "Não instalado"} />
              <div className="flex items-center gap-2">
                <Radio className={"h-4 w-4 " + (vehicle.deviceStatus === "online" ? "text-green-600" : "text-gray-400")} />
                <span>{vehicle.deviceStatus ?? "offline"}</span>
              </div>
              <Info label="Último contato" value={formatDate(vehicle.deviceLastSeenAt)} />
              <Info label="Última análise" value={formatDate(vehicle.ultimaAnalise)} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Telemetria recebida</CardTitle>
            <CardDescription>Temperatura, vibração e tensão — últimas 14 medições</CardDescription>
          </CardHeader>
          <CardContent>
            {readings.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">Aguardando a primeira leitura do ESP32.</div>
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={readings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" hide />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => formatDate(String(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" name="Temperatura (°C)" stroke="#4A148C" strokeWidth={2} />
                    <Line type="monotone" dataKey="vibration" name="Vibração (g)" stroke="#E63946" strokeWidth={2} />
                    <Line type="monotone" dataKey="voltage" name="Tensão (V)" stroke="#457B9D" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Alertas do veículo</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Componente</TableHead><TableHead>Risco</TableHead>
                  <TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleAlerts.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center">Nenhum alerta registrado.</TableCell></TableRow>
                ) : vehicleAlerts.map((alert, index) => (
                  <TableRow key={alert.id ?? alert.date + index}>
                    <TableCell>{alert.component}</TableCell>
                    <TableCell><span className={"rounded-full px-2 py-1 text-xs " + riskColors[alert.riskLevel]}>{alert.riskLevel}</span></TableCell>
                    <TableCell><span className={"rounded-full px-2 py-1 text-xs " + alertStatusColors[alert.status]}>{alert.status}</span></TableCell>
                    <TableCell>{formatDate(alert.date)}</TableCell>
                    <TableCell>{alert.description}</TableCell>
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

const Info = ({ label, value }: { label: string; value: string | number }) => (
  <div><p className="text-sm text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>
);

export default VehicleDetail;
