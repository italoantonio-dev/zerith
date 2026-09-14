import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { alertStatusColors, riskColors } from "@/data/mockData";
import { zerithApi } from "@/lib/api";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

const Alerts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("todos");
  const navigate = useNavigate();
  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ["alerts"],
    queryFn: zerithApi.alerts,
    refetchInterval: 15_000,
  });

  const term = searchTerm.toLowerCase();
  const filteredAlerts = alerts.filter((alert) =>
    (riskFilter === "todos" || alert.riskLevel === riskFilter) &&
    (alert.vehicleId.toLowerCase().includes(term) ||
      alert.component.toLowerCase().includes(term) ||
      (alert.description ?? "").toLowerCase().includes(term))
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1333]">Alertas inteligentes</h2>
          <p className="text-sm text-muted-foreground">Ocorrências geradas pelas regras de telemetria</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Buscar veículo, componente ou descrição..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="max-w-md"
          />
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Risco" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os riscos</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="baixo">Baixo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader><CardTitle>Ocorrências</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p>Carregando alertas...</p> : error ? <p className="text-red-600">Não foi possível consultar a API.</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Componente</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Recomendação</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center">Nenhum alerta. Envie uma telemetria crítica para testar.</TableCell></TableRow>
                  ) : filteredAlerts.map((alert, index) => (
                    <TableRow key={alert.id ?? alert.vehicleId + alert.date + index}>
                      <TableCell className="font-medium">{alert.vehicleId}</TableCell>
                      <TableCell>{alert.component}</TableCell>
                      <TableCell><span className={"rounded-full px-2 py-1 text-xs " + riskColors[alert.riskLevel]}>{alert.riskLevel}</span></TableCell>
                      <TableCell><span className={"rounded-full px-2 py-1 text-xs " + alertStatusColors[alert.status]}>{alert.status}</span></TableCell>
                      <TableCell>{formatDate(alert.date)}</TableCell>
                      <TableCell className="max-w-sm">{alert.recommendation}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => navigate("/veiculo/" + alert.vehicleId)}>
                          <Eye className="mr-1 h-4 w-4" /> Veículo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Alerts;
