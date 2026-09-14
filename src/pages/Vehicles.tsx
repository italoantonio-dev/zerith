import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, Radio } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { statusColors } from "@/data/mockData";
import { zerithApi } from "@/lib/api";

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Sem leitura";

const Vehicles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { data: vehicles = [], isLoading, error } = useQuery({
    queryKey: ["vehicles"],
    queryFn: zerithApi.vehicles,
    refetchInterval: 15_000,
  });

  const term = searchTerm.toLowerCase();
  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.placa.toLowerCase().includes(term) ||
    vehicle.modelo.toLowerCase().includes(term) ||
    vehicle.id.toLowerCase().includes(term)
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1333]">Veículos monitorados</h2>
            <p className="text-sm text-muted-foreground">Dados reais da empresa autenticada</p>
          </div>
          <Input
            placeholder="Buscar por ID, placa ou modelo..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="max-w-xs"
          />
        </div>

        <Card>
          <CardHeader><CardTitle>Frota atual</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p>Carregando frota...</p> : error ? <p className="text-red-600">Não foi possível consultar a API.</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Última análise</TableHead>
                    <TableHead>Quilometragem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="py-8 text-center">Nenhum veículo encontrado.</TableCell></TableRow>
                  ) : filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.id}</TableCell>
                      <TableCell>{vehicle.placa}</TableCell>
                      <TableCell>{vehicle.modelo}</TableCell>
                      <TableCell>
                        <span className={"rounded-full px-2 py-1 text-xs " + statusColors[vehicle.status]}>{vehicle.status}</span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          <Radio className={"h-3 w-3 " + (vehicle.deviceStatus === "online" ? "text-green-600" : "text-gray-400")} />
                          {vehicle.deviceStatus ?? "sem dispositivo"}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(vehicle.ultimaAnalise)}</TableCell>
                      <TableCell>{Number(vehicle.km).toLocaleString("pt-BR")} km</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => navigate("/veiculo/" + vehicle.id)}>
                          <Eye className="mr-1 h-4 w-4" /> Detalhes
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

export default Vehicles;
