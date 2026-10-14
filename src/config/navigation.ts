export type ModuleStatus = "BETA" | "EM_DESENVOLVIMENTO";
export type ReferenceConfidence = "CONFIRMADO" | "INFERIDO" | "NAO_VERIFICADO" | "BLOQUEADO";

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  sectionPath: string;
  description: string;
  objective: string;
  plannedCapabilities: string[];
  status: ModuleStatus;
  webFunctionIds: string[];
}

export interface NavigationGroup {
  id: string;
  label: string;
  items: NavigationItem[];
}

export interface WebFunctionTrace {
  webFunctionId: string;
  referenceName: string;
  referenceConfidence: ReferenceConfidence[];
  moduleId: string;
  path: string;
  status: ModuleStatus;
  dependencies: string[];
  acceptanceCriteria: string;
  priority: "P0" | "P1" | "P2" | "P3";
  effort: "PEQUENO" | "MEDIO" | "GRANDE";
}

const beta = (item: Omit<NavigationItem, "status">): NavigationItem => ({ ...item, status: "BETA" });
const planned = (item: Omit<NavigationItem, "status">): NavigationItem => ({ ...item, status: "EM_DESENVOLVIMENTO" });

const overviewItems = [
  beta({ id: "dashboard", label: "Dashboard", path: "/dashboard", sectionPath: "/dashboard", description: "Visão consolidada da saúde operacional da frota autenticada.", objective: "Acompanhar disponibilidade, alertas e veículos monitorados sem reproduzir métricas de terceiros.", plannedCapabilities: ["Resumo operacional", "Alertas recentes", "Acesso ao diagnóstico de veículos"], webFunctionIds: ["WEB-FUNC-047"] }),
  beta({ id: "alerts", label: "Central de alertas", path: "/alertas", sectionPath: "/alertas", description: "Ocorrências geradas por regras de telemetria da Zerith.", objective: "Priorizar atenção operacional com dados retornados pela API protegida.", plannedCapabilities: ["Consulta de alertas", "Filtro por risco", "Acesso ao veículo relacionado"], webFunctionIds: ["WEB-FUNC-049"] }),
  planned({ id: "analytics", label: "Análises", path: "/analises", sectionPath: "/analises", description: "Área futura para análises operacionais com critérios explícitos.", objective: "Apresentar análises auditáveis após a definição de fontes e fórmulas.", plannedCapabilities: ["Indicadores auditáveis", "Recortes por período", "Explicação de critérios"], webFunctionIds: [] }),
];

const trackingItems = [
  beta({ id: "tracking-map", label: "Mapa e trajetória", path: "/rastreamento", sectionPath: "/rastreamento", description: "Acompanhamento de veículos e histórico de posições GPS no mapa.", objective: "Visualizar posições fornecidas pela API e trajetórias cronológicas sem inventar coordenadas.", plannedCapabilities: ["Mapa MapLibre", "Histórico de posições", "Trajetória GeoJSON"], webFunctionIds: ["WEB-FUNC-019"] }),
  planned({ id: "tracking-devices", label: "Dispositivos", path: "/rastreamento/dispositivos", sectionPath: "/rastreamento", description: "Gestão futura de vínculos e saúde de dispositivos de telemetria.", objective: "Dar visibilidade a dispositivos vinculados a veículos autorizados.", plannedCapabilities: ["Vínculo dispositivo-veículo", "Estado de conexão", "Histórico técnico"], webFunctionIds: ["WEB-FUNC-020"] }),
  planned({ id: "control-tower", label: "Torre de controle", path: "/rastreamento/torre", sectionPath: "/rastreamento", description: "Central futura de eventos operacionais e severidade.", objective: "Priorizar eventos da frota com regras e ponderações próprias e auditáveis.", plannedCapabilities: ["Eventos por veículo", "Filtros por período", "Severidade explicável"], webFunctionIds: ["WEB-FUNC-021", "WEB-FUNC-048"] }),
  planned({ id: "driving-ranking", label: "Ranking operacional", path: "/rastreamento/ranking", sectionPath: "/rastreamento", description: "Ranking futuro centrado em veículo, operação e segurança.", objective: "Comparar veículos por critérios não disciplinares e auditáveis.", plannedCapabilities: ["Critérios publicados", "Comparação por veículo", "Explicação de pontuação"], webFunctionIds: ["WEB-FUNC-022"] }),
  planned({ id: "base-point", label: "Ponto base", path: "/rastreamento/ponto-base", sectionPath: "/rastreamento", description: "Referências operacionais futuras para veículos e jornadas.", objective: "Definir pontos-base com autorização e rastreabilidade.", plannedCapabilities: ["Referência geográfica", "Vínculo operacional", "Histórico de alterações"], webFunctionIds: ["WEB-FUNC-023"] }),
  planned({ id: "share-location", label: "Compartilhamento", path: "/rastreamento/compartilhar", sectionPath: "/rastreamento", description: "Compartilhamento futuro de localização com controle de acesso.", objective: "Permitir acesso temporário sem expor dados de tenant indevidamente.", plannedCapabilities: ["Links com expiração", "Auditoria", "Revogação"], webFunctionIds: ["WEB-FUNC-024"] }),
  planned({ id: "trip-history", label: "Histórico de viagens", path: "/rastreamento/viagens", sectionPath: "/rastreamento", description: "Histórico futuro de deslocamentos consolidados.", objective: "Consultar viagens após definição de regras de início, fim e distância.", plannedCapabilities: ["Linha do tempo", "Filtros de período", "Rota no mapa"], webFunctionIds: [] }),
  planned({ id: "points-of-interest", label: "Pontos de interesse", path: "/rastreamento/pontos-interesse", sectionPath: "/rastreamento", description: "Locais operacionais definidos pelo tenant.", objective: "Gerenciar referências geográficas com isolamento multi-tenant.", plannedCapabilities: ["Cadastro geográfico", "Categorias", "Uso em eventos"], webFunctionIds: ["WEB-FUNC-032"] }),
  planned({ id: "geofences", label: "Cercas virtuais", path: "/rastreamento/cercas", sectionPath: "/rastreamento", description: "Áreas geográficas futuras para eventos operacionais.", objective: "Configurar cercas e eventos sem cruzar dados entre tenants.", plannedCapabilities: ["Geometrias", "Eventos de entrada e saída", "Visualização no mapa"], webFunctionIds: ["WEB-FUNC-033"] }),
];

const fleetItems = [
  beta({ id: "vehicles", label: "Veículos", path: "/veiculos", sectionPath: "/veiculos", description: "Frota monitorada da empresa autenticada.", objective: "Consultar veículos retornados pela API protegida.", plannedCapabilities: ["Busca", "Status", "Acesso ao detalhe"], webFunctionIds: ["WEB-FUNC-025"] }),
  planned({ id: "fleets", label: "Frotas", path: "/frotas", sectionPath: "/frotas", description: "Agrupamentos futuros de veículos por operação.", objective: "Organizar veículos após a modelagem da entidade de frota.", plannedCapabilities: ["Cadastro de frota", "Vínculo de veículos", "Filtros operacionais"], webFunctionIds: ["WEB-FUNC-026"] }),
  planned({ id: "drivers", label: "Motoristas", path: "/motoristas", sectionPath: "/motoristas", description: "Cadastro futuro de motoristas vinculados à frota.", objective: "Controlar autoria e acesso por CPF confirmado, sem substituir a referência estável do veículo.", plannedCapabilities: ["CPF confirmado", "Vínculo veículo-motorista", "Histórico de atribuições"], webFunctionIds: ["WEB-FUNC-027"] }),
  planned({ id: "departments", label: "Departamentos", path: "/organizacao/departamentos", sectionPath: "/organizacao/departamentos", description: "Estrutura organizacional futura por tenant.", objective: "Organizar operações sem confiar em identificadores enviados pelo cliente.", plannedCapabilities: ["Cadastro tenant-bound", "Vínculos operacionais", "Filtros"], webFunctionIds: ["WEB-FUNC-028"] }),
  planned({ id: "work-shifts", label: "Expedientes", path: "/organizacao/expedientes", sectionPath: "/organizacao/expedientes", description: "Regras futuras de jornada e disponibilidade.", objective: "Suportar análises de expediente com tratamento explícito de timezone.", plannedCapabilities: ["Calendários", "Janelas de horário", "Vínculos operacionais"], webFunctionIds: ["WEB-FUNC-029"] }),
  planned({ id: "cost-centers", label: "Centros de custo", path: "/organizacao/centros-custo", sectionPath: "/organizacao/centros-custo", description: "Classificação financeira futura da operação.", objective: "Associar custos apenas a entidades autorizadas do tenant.", plannedCapabilities: ["Cadastro", "Vínculos", "Filtros"], webFunctionIds: ["WEB-FUNC-030"] }),
  planned({ id: "agents", label: "Agentes", path: "/organizacao/agentes", sectionPath: "/organizacao/agentes", description: "Gestão futura de agentes operacionais.", objective: "Definir entidades e permissões antes de abrir operações administrativas.", plannedCapabilities: ["Cadastro", "Status", "Auditoria"], webFunctionIds: ["WEB-FUNC-031"] }),
];

const costItems = [
  planned({ id: "cost-entries", label: "Lançamentos", path: "/custos/lancamentos", sectionPath: "/custos/lancamentos", description: "Registro futuro de custos operacionais.", objective: "Registrar custos após definição de fonte, categoria e autorização.", plannedCapabilities: ["Lançamentos", "Classificação", "Consulta por período"], webFunctionIds: ["WEB-FUNC-034"] }),
  planned({ id: "consumption", label: "Média de consumo", path: "/custos/consumo", sectionPath: "/custos/consumo", description: "Análise futura de consumo baseada em fontes verificadas.", objective: "Calcular consumo apenas com fórmula e dados de abastecimento aprovados.", plannedCapabilities: ["Indicadores", "Método documentado", "Recorte por veículo"], webFunctionIds: ["WEB-FUNC-035"] }),
  planned({ id: "tolls", label: "Pedágios", path: "/custos/pedagios", sectionPath: "/custos/pedagios", description: "Controle futuro de despesas de pedágio.", objective: "Conciliar pedágios com fonte de dados verificável.", plannedCapabilities: ["Importação validada", "Vínculo a veículo", "Auditoria"], webFunctionIds: ["WEB-FUNC-036"] }),
  planned({ id: "suppliers", label: "Fornecedores", path: "/custos/fornecedores", sectionPath: "/custos/fornecedores", description: "Cadastro futuro de fornecedores.", objective: "Gerenciar fornecedores no limite do tenant autenticado.", plannedCapabilities: ["Cadastro", "Vínculos de custo", "Histórico"], webFunctionIds: ["WEB-FUNC-037"] }),
  planned({ id: "cost-categories", label: "Categorias", path: "/custos/categorias", sectionPath: "/custos/categorias", description: "Categorias futuras para classificação financeira.", objective: "Padronizar custos antes de habilitar lançamentos e relatórios.", plannedCapabilities: ["Cadastro", "Vínculos", "Filtros"], webFunctionIds: ["WEB-FUNC-038"] }),
];

const maintenanceItems = [
  planned({ id: "maintenance-history", label: "Histórico", path: "/historico", sectionPath: "/historico", description: "Histórico de manutenção aguardando fonte operacional real.", objective: "Substituir dados locais simulados por registros tenant-bound antes de qualquer uso operacional.", plannedCapabilities: ["Registros reais", "Filtros auditáveis", "Vínculo ao veículo"], webFunctionIds: [] }),
  planned({ id: "maintenance-scheduling", label: "Agendamentos", path: "/manutencao/agendamentos", sectionPath: "/manutencao/agendamentos", description: "Planejamento futuro de manutenções.", objective: "Agendar apenas após modelagem de planos, veículos e executores.", plannedCapabilities: ["Agenda", "Regras preventivas", "Notificações"], webFunctionIds: ["WEB-FUNC-039"] }),
  planned({ id: "maintenance-plans", label: "Planos", path: "/manutencao/planos", sectionPath: "/manutencao/planos", description: "Planos futuros de manutenção preventiva.", objective: "Modelar itens e critérios antes de calcular vencimentos.", plannedCapabilities: ["Planos", "Itens", "Critérios de execução"], webFunctionIds: ["WEB-FUNC-040"] }),
  planned({ id: "maintenance-departments", label: "Departamentos", path: "/manutencao/departamentos", sectionPath: "/manutencao/departamentos", description: "Estrutura futura da operação de manutenção.", objective: "Organizar manutenção sem duplicar a estrutura organizacional sem regra definida.", plannedCapabilities: ["Cadastro", "Vínculos", "Filtros"], webFunctionIds: ["WEB-FUNC-041"] }),
  planned({ id: "maintenance-executors", label: "Executores", path: "/manutencao/executores", sectionPath: "/manutencao/executores", description: "Responsáveis futuros pela execução de manutenção.", objective: "Manter rastreabilidade de responsáveis e operações.", plannedCapabilities: ["Cadastro", "Atribuição", "Histórico"], webFunctionIds: ["WEB-FUNC-042"] }),
];

const operationItems = [
  planned({ id: "reservations", label: "Reservas", path: "/operacao/reservas", sectionPath: "/operacao/reservas", description: "Reservas futuras de veículos por período.", objective: "Controlar conflitos e autorização antes de disponibilizar reservas.", plannedCapabilities: ["Agenda", "Conflitos", "Aprovação"], webFunctionIds: ["WEB-FUNC-043"] }),
  planned({ id: "checklists", label: "Checklists", path: "/operacao/checklists", sectionPath: "/operacao/checklists", description: "Execuções futuras de checklist por motorista e veículo.", objective: "Registrar autoria por CPF confirmado e condição real do veículo.", plannedCapabilities: ["Execuções", "Criticidade", "Histórico"], webFunctionIds: [] }),
  planned({ id: "checklist-forms", label: "Formulários de checklist", path: "/operacao/formularios-checklist", sectionPath: "/operacao/checklists", description: "Definição futura de formulários versionados.", objective: "Versionar itens sem alterar o histórico de execuções concluídas.", plannedCapabilities: ["Formulários", "Versões", "Itens críticos"], webFunctionIds: ["WEB-FUNC-044"] }),
  planned({ id: "checklist-options", label: "Tabelas de opções", path: "/operacao/tabelas-opcoes", sectionPath: "/operacao/checklists", description: "Opções reutilizáveis para checklists futuros.", objective: "Padronizar escolhas sem simular formulários inexistentes.", plannedCapabilities: ["Tabelas de opções", "Vínculo a itens", "Versionamento"], webFunctionIds: ["WEB-FUNC-045"] }),
  planned({ id: "registrations", label: "Central de cadastros", path: "/operacao/cadastros", sectionPath: "/operacao/cadastros", description: "Atalhos futuros para cadastros operacionais.", objective: "Concentrar acessos apenas quando módulos dependentes existirem.", plannedCapabilities: ["Atalhos", "Permissões futuras", "Contexto operacional"], webFunctionIds: ["WEB-FUNC-046"] }),
];

const reportCatalog = planned({ id: "reports-catalog", label: "Relatórios", path: "/relatorios", sectionPath: "/relatorios", description: "Catálogo de relatórios operacionais planejados.", objective: "Dar visibilidade ao backlog analítico sem simular filtros, tabelas ou exportações.", plannedCapabilities: ["Categorias", "Estado de cada relatório", "Dependências declaradas"], webFunctionIds: ["WEB-FUNC-001"] });

export const reportModules = [
  planned({ id: "report-travel", label: "Viagens", path: "/relatorios/viagens", sectionPath: "/relatorios", description: "Consolidação futura de viagens a partir de posições e regras explícitas.", objective: "Analisar viagens sem inferir início, fim ou distância sem contrato validado.", plannedCapabilities: ["Período", "Veículos", "Linha do tempo"], webFunctionIds: ["WEB-FUNC-002"] }),
  planned({ id: "report-speed", label: "Excesso de velocidade", path: "/relatorios/excesso-velocidade", sectionPath: "/relatorios", description: "Eventos futuros de velocidade acima de limite definido.", objective: "Apresentar violações somente com limites e tolerâncias auditáveis.", plannedCapabilities: ["Eventos", "Limites", "Rota associada"], webFunctionIds: ["WEB-FUNC-003"] }),
  planned({ id: "report-off-hours", label: "Fora de expediente", path: "/relatorios/fora-expediente", sectionPath: "/relatorios", description: "Deslocamentos futuros fora de jornadas configuradas.", objective: "Analisar período com expediente e timezone explicitamente definidos.", plannedCapabilities: ["Período", "Expedientes", "Eventos"], webFunctionIds: ["WEB-FUNC-004"] }),
  planned({ id: "report-anomalies", label: "Anomalias", path: "/relatorios/anomalias", sectionPath: "/relatorios", description: "Eventos futuros classificados por regras da Zerith.", objective: "Exibir anomalias somente após taxonomia e critérios serem aprovados.", plannedCapabilities: ["Categorias", "Critérios", "Eventos"], webFunctionIds: ["WEB-FUNC-005"] }),
  planned({ id: "report-idle", label: "Ociosidade", path: "/relatorios/ocioso", sectionPath: "/relatorios", description: "Períodos futuros de inatividade operacional.", objective: "Calcular ociosidade com parâmetros verificáveis de ignição e deslocamento.", plannedCapabilities: ["Período", "Critérios", "Veículos"], webFunctionIds: ["WEB-FUNC-006"] }),
  planned({ id: "report-temperature", label: "Fora de temperatura", path: "/relatorios/temperatura", sectionPath: "/relatorios", description: "Leituras futuras fora de faixas térmicas configuradas.", objective: "Alertar somente com sensores e faixas validadas por operação.", plannedCapabilities: ["Leituras", "Faixas", "Veículos"], webFunctionIds: ["WEB-FUNC-007"] }),
  planned({ id: "report-geofence", label: "Movimentação em cerca", path: "/relatorios/movimentacao-cerca", sectionPath: "/relatorios", description: "Eventos futuros de entrada e saída de áreas virtuais.", objective: "Relatar movimentações após implementação de geometrias e motor de eventos.", plannedCapabilities: ["Cercas", "Entrada e saída", "Tempo de permanência"], webFunctionIds: ["WEB-FUNC-008"] }),
  planned({ id: "report-sensors", label: "Sensores", path: "/relatorios/sensores", sectionPath: "/relatorios", description: "Acionamentos futuros de sensores integrados.", objective: "Apresentar leituras somente com contrato de sensores definido.", plannedCapabilities: ["Eventos", "Tipos de sensor", "Período"], webFunctionIds: ["WEB-FUNC-009"] }),
  planned({ id: "report-transmissions", label: "Transmissões", path: "/relatorios/transmissoes", sectionPath: "/relatorios", description: "Histórico futuro de transmissões de telemetria.", objective: "Consultar sinais brutos com retenção, paginação e autorização.", plannedCapabilities: ["Período", "Ignição", "Veículos"], webFunctionIds: ["WEB-FUNC-010"] }),
  planned({ id: "report-work-shifts", label: "Jornada de trabalho", path: "/relatorios/jornada", sectionPath: "/relatorios", description: "Análise futura de jornadas operacionais.", objective: "Relacionar jornada a motorista, veículo e expediente aprovados.", plannedCapabilities: ["Período", "Motoristas", "Expedientes"], webFunctionIds: ["WEB-FUNC-011"] }),
  planned({ id: "report-identification", label: "Identificação", path: "/relatorios/identificacao", sectionPath: "/relatorios", description: "Histórico futuro de identificação operacional.", objective: "Rastrear identificação por CPF confirmado e vínculo real.", plannedCapabilities: ["Motoristas", "Veículos", "Histórico"], webFunctionIds: ["WEB-FUNC-012"] }),
  planned({ id: "report-approach", label: "Aproximação", path: "/relatorios/aproximacao", sectionPath: "/relatorios", description: "Análise futura de aproximação a pontos de interesse.", objective: "Medir aproximações com distância e regras publicadas.", plannedCapabilities: ["Pontos de interesse", "Distância", "Tempo"], webFunctionIds: ["WEB-FUNC-013"] }),
  planned({ id: "report-co2", label: "Emissão de CO₂", path: "/relatorios/emissao-co2", sectionPath: "/relatorios", description: "Estimativas futuras de emissão por operação.", objective: "Publicar emissão somente com metodologia e fatores documentados.", plannedCapabilities: ["Distância", "Combustível", "Metodologia"], webFunctionIds: ["WEB-FUNC-014"] }),
  planned({ id: "report-management", label: "Gerencial", path: "/relatorios/gerencial", sectionPath: "/relatorios", description: "Resumo futuro de indicadores operacionais por veículo.", objective: "Consolidar métricas somente após definição de fórmulas e fonte.", plannedCapabilities: ["Agregados", "Período", "Veículos"], webFunctionIds: ["WEB-FUNC-015"] }),
  planned({ id: "report-odometer", label: "Hodômetro", path: "/relatorios/hodometro", sectionPath: "/relatorios", description: "Leituras futuras de hodômetro.", objective: "Tratar inconsistências e origem antes de calcular variações.", plannedCapabilities: ["Leituras", "Período", "Origem"], webFunctionIds: ["WEB-FUNC-016"] }),
  planned({ id: "report-hourmeter", label: "Horímetro", path: "/relatorios/horimetro", sectionPath: "/relatorios", description: "Leituras futuras de horímetro.", objective: "Distinguir acumulado e delta com fonte telemétrica verificada.", plannedCapabilities: ["Leituras", "Período", "Origem"], webFunctionIds: ["WEB-FUNC-017"] }),
  planned({ id: "report-checklist-executions", label: "Execuções de checklist", path: "/relatorios/execucoes-checklist", sectionPath: "/relatorios", description: "Relatório futuro de checklists concluídos.", objective: "Consultar execuções somente após modelagem de checklist versionado.", plannedCapabilities: ["Motoristas", "Veículos", "Criticidade"], webFunctionIds: ["WEB-FUNC-018"] }),
];

const intelligenceItems = [
  planned({ id: "mechanical-health", label: "Saúde mecânica", path: "/inteligencia/saude-mecanica", sectionPath: "/inteligencia/saude-mecanica", description: "Análises futuras de condição mecânica.", objective: "Evoluir apenas com modelos validados, dados suficientes e explicação operacional.", plannedCapabilities: ["Sinais", "Evidências", "Critérios"], webFunctionIds: [] }),
  beta({ id: "telemetry-alerts", label: "Alertas de telemetria", path: "/alertas", sectionPath: "/alertas", description: "Ocorrências de telemetria disponíveis na central de alertas.", objective: "Consultar alertas retornados pela API protegida.", plannedCapabilities: ["Consulta", "Filtro", "Vínculo de veículo"], webFunctionIds: [] }),
  planned({ id: "predictive-analysis", label: "Análise preditiva", path: "/inteligencia/preditiva", sectionPath: "/inteligencia/preditiva", description: "Iniciativa futura de análise preditiva.", objective: "Não alegar IA preditiva antes de validação científica e operacional.", plannedCapabilities: ["Hipóteses", "Validação", "Explicabilidade"], webFunctionIds: [] }),
];

const administrationItems = [
  planned({ id: "users-permissions", label: "Usuários e permissões", path: "/administracao/usuarios", sectionPath: "/administracao/usuarios", description: "Administração futura de usuários e permissões.", objective: "Evoluir RBAC somente com contrato de autorização e auditoria próprios.", plannedCapabilities: ["Usuários", "Papéis", "Auditoria"], webFunctionIds: [] }),
  planned({ id: "settings", label: "Configurações", path: "/configuracoes", sectionPath: "/configuracoes", description: "Configurações aguardando persistência e autorização backend reais.", objective: "Não apresentar ações simuladas como configurações aplicadas.", plannedCapabilities: ["Preferências persistidas", "Permissões", "Auditoria"], webFunctionIds: [] }),
  planned({ id: "integrations", label: "Integrações", path: "/administracao/integracoes", sectionPath: "/administracao/integracoes", description: "Integrações futuras com serviços externos aprovados.", objective: "Expor integrações somente com segredo protegido e contrato versionado.", plannedCapabilities: ["Credenciais protegidas", "Status", "Auditoria"], webFunctionIds: [] }),
];

export const navigationGroups: NavigationGroup[] = [
  { id: "overview", label: "Visão geral", items: overviewItems },
  { id: "tracking", label: "Rastreamento", items: trackingItems },
  { id: "fleet", label: "Gestão de frota", items: fleetItems },
  { id: "costs", label: "Custos", items: costItems },
  { id: "maintenance", label: "Manutenção", items: maintenanceItems },
  { id: "operation", label: "Operação", items: operationItems },
  { id: "reports", label: "Relatórios", items: [reportCatalog] },
  { id: "intelligence", label: "Inteligência Zerith", items: intelligenceItems },
  { id: "administration", label: "Administração", items: administrationItems },
];

const navigationItems = navigationGroups.flatMap((group) => group.items);
export const developmentModules = [...navigationItems, ...reportModules].filter((item) => item.status === "EM_DESENVOLVIMENTO");
export const allModules = [...navigationItems, ...reportModules];

export function getNavigationItemByPath(path: string) {
  return allModules.find((item) => item.path === path);
}

const trace = (webFunctionId: string, referenceName: string, referenceConfidence: ReferenceConfidence[], moduleId: string, dependencies: string[], acceptanceCriteria: string, priority: WebFunctionTrace["priority"], effort: WebFunctionTrace["effort"]): WebFunctionTrace => {
  const module = allModules.find((item) => item.id === moduleId);
  if (!module) throw new Error(`Módulo ausente para ${webFunctionId}`);
  return { webFunctionId, referenceName, referenceConfidence, moduleId, path: module.path, status: module.status, dependencies, acceptanceCriteria, priority, effort };
};

export const webFunctionTraceability: WebFunctionTrace[] = [
  trace("WEB-FUNC-001", "Catálogo de relatórios", ["CONFIRMADO", "NAO_VERIFICADO"], "reports-catalog", ["Manifesto de relatórios"], "Catálogo apresenta somente estado e dependências reais.", "P2", "MEDIO"),
  trace("WEB-FUNC-002", "Viagens", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "report-travel", ["Histórico GPS", "Regras de viagem"], "Viagens têm contrato e critérios de consolidação publicados.", "P1", "GRANDE"),
  trace("WEB-FUNC-003", "Excesso de velocidade", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "report-speed", ["Eventos", "Limites de velocidade"], "Eventos possuem limite, tolerância e origem auditáveis.", "P1", "GRANDE"),
  trace("WEB-FUNC-004", "Fora de expediente", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "report-off-hours", ["Expedientes", "Eventos", "Timezone"], "Janelas e tolerâncias são documentadas.", "P2", "GRANDE"),
  trace("WEB-FUNC-005", "Anomalias", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "report-anomalies", ["Taxonomia de eventos"], "Cada anomalia tem regra explicável.", "P2", "GRANDE"),
  trace("WEB-FUNC-006", "Ociosidade", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "report-idle", ["Ignição", "GPS", "Limiar"], "Ociosidade possui limiar de deslocamento e ignição documentados.", "P2", "MEDIO"),
  trace("WEB-FUNC-007", "Fora de temperatura", ["CONFIRMADO", "NAO_VERIFICADO"], "report-temperature", ["Sensores", "Faixas térmicas"], "Leituras usam faixas autorizadas por operação.", "P3", "GRANDE"),
  trace("WEB-FUNC-008", "Movimentação em cerca", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "report-geofence", ["Cercas", "Motor de eventos"], "Entradas e saídas são calculadas em geometrias válidas.", "P3", "GRANDE"),
  trace("WEB-FUNC-009", "Sensores", ["CONFIRMADO", "NAO_VERIFICADO"], "report-sensors", ["Contrato de sensores"], "Tipos e critérios de sensor são definidos.", "P3", "GRANDE"),
  trace("WEB-FUNC-010", "Transmissões", ["CONFIRMADO", "NAO_VERIFICADO"], "report-transmissions", ["Telemetria", "Retenção"], "Consulta é paginada e tenant-bound.", "P2", "MEDIO"),
  trace("WEB-FUNC-011", "Jornada de trabalho", ["CONFIRMADO", "NAO_VERIFICADO"], "report-work-shifts", ["Expedientes", "Motoristas", "Veículos"], "Jornadas respeitam timezone e vínculos reais.", "P3", "GRANDE"),
  trace("WEB-FUNC-012", "Identificação", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "report-identification", ["Motoristas", "CPF confirmado"], "Identificação preserva vínculo e autoria verificáveis.", "P2", "GRANDE"),
  trace("WEB-FUNC-013", "Aproximação", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "report-approach", ["Pontos de interesse", "GPS"], "Distância de referência é configurada e auditável.", "P3", "GRANDE"),
  trace("WEB-FUNC-014", "Emissão de CO₂", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "report-co2", ["Combustível", "Metodologia"], "Fatores e fórmulas são publicados.", "P3", "GRANDE"),
  trace("WEB-FUNC-015", "Gerencial", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "report-management", ["Agregados diários", "Eventos"], "Indicadores possuem fonte e fórmula rastreáveis.", "P2", "GRANDE"),
  trace("WEB-FUNC-016", "Hodômetro", ["CONFIRMADO", "NAO_VERIFICADO"], "report-odometer", ["Leitura de odômetro"], "Origem e tratamento de inconsistências são declarados.", "P3", "MEDIO"),
  trace("WEB-FUNC-017", "Horímetro", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "report-hourmeter", ["Telemetria", "Horímetro"], "Acumulado e delta são distinguíveis.", "P3", "MEDIO"),
  trace("WEB-FUNC-018", "Execução de checklist", ["BLOQUEADO", "NAO_VERIFICADO"], "report-checklist-executions", ["Checklists versionados", "CPF confirmado"], "Execuções preservam formulário, autor e veículo.", "P2", "GRANDE"),
  trace("WEB-FUNC-019", "Mapa", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "tracking-map", ["API de rastreamento", "MapLibre", "Tiles licenciados"], "Mapa autenticado mostra somente dados do tenant e trajetória real.", "P0", "MEDIO"),
  trace("WEB-FUNC-020", "Dispositivos", ["CONFIRMADO", "INFERIDO", "NAO_VERIFICADO"], "tracking-devices", ["Modelo de dispositivo", "Veículos"], "Dispositivos possuem vínculo e estado reais.", "P2", "GRANDE"),
  trace("WEB-FUNC-021", "Torre de controle", ["CONFIRMADO", "NAO_VERIFICADO"], "control-tower", ["Eventos", "Severidade"], "Eventos têm categoria, severidade e autorização.", "P1", "GRANDE"),
  trace("WEB-FUNC-022", "Ranking de condução", ["CONFIRMADO", "NAO_VERIFICADO"], "driving-ranking", ["Eventos", "Critérios"], "Ranking por veículo tem critérios não disciplinares e auditáveis.", "P3", "GRANDE"),
  trace("WEB-FUNC-023", "Ponto base", ["CONFIRMADO", "NAO_VERIFICADO"], "base-point", ["GPS", "Organização"], "Pontos-base têm escopo tenant-bound.", "P3", "MEDIO"),
  trace("WEB-FUNC-024", "Compartilhar localização", ["CONFIRMADO", "NAO_VERIFICADO"], "share-location", ["Autorização", "Auditoria"], "Links expiram e podem ser revogados.", "P3", "GRANDE"),
  trace("WEB-FUNC-025", "Veículos", ["CONFIRMADO", "NAO_VERIFICADO"], "vehicles", ["API de veículos"], "Consulta autenticada retorna apenas veículos do tenant.", "P0", "MEDIO"),
  trace("WEB-FUNC-026", "Frotas", ["CONFIRMADO", "NAO_VERIFICADO"], "fleets", ["Entidade frota", "Veículos"], "Vínculos de frota são tenant-bound.", "P2", "GRANDE"),
  trace("WEB-FUNC-027", "Motoristas", ["CONFIRMADO", "NAO_VERIFICADO"], "drivers", ["CPF confirmado", "Veículos"], "Autoria e vínculos preservam CPF confirmado.", "P2", "GRANDE"),
  trace("WEB-FUNC-028", "Departamentos", ["CONFIRMADO", "NAO_VERIFICADO"], "departments", ["Organização"], "Consultas são limitadas ao tenant autenticado.", "P3", "MEDIO"),
  trace("WEB-FUNC-029", "Expediente", ["CONFIRMADO", "NAO_VERIFICADO"], "work-shifts", ["Timezone", "Organização"], "Expedientes têm regras de borda e timezone testados.", "P3", "GRANDE"),
  trace("WEB-FUNC-030", "Centros de custo", ["CONFIRMADO", "NAO_VERIFICADO"], "cost-centers", ["Organização", "Custos"], "Centros de custo são tenant-bound.", "P3", "MEDIO"),
  trace("WEB-FUNC-031", "Agentes", ["CONFIRMADO", "NAO_VERIFICADO"], "agents", ["Modelo de agente", "Permissões"], "Papel e operações do agente são definidos.", "P3", "GRANDE"),
  trace("WEB-FUNC-032", "Pontos de interesse", ["CONFIRMADO", "NAO_VERIFICADO"], "points-of-interest", ["Geolocalização"], "POIs são tenant-bound e geograficamente válidos.", "P3", "GRANDE"),
  trace("WEB-FUNC-033", "Cercas virtuais", ["CONFIRMADO", "NAO_VERIFICADO"], "geofences", ["Geometrias", "GPS"], "Cercas validam geometria e isolamento do tenant.", "P3", "GRANDE"),
  trace("WEB-FUNC-034", "Lançamento de custos", ["CONFIRMADO", "NAO_VERIFICADO"], "cost-entries", ["Categorias", "Centros de custo"], "Custos têm fonte e autorização rastreáveis.", "P3", "GRANDE"),
  trace("WEB-FUNC-035", "Média de consumo", ["CONFIRMADO", "NAO_VERIFICADO"], "consumption", ["Abastecimentos", "Hodômetro"], "Método de cálculo é documentado e reproduzível.", "P3", "GRANDE"),
  trace("WEB-FUNC-036", "Pedágios", ["CONFIRMADO", "NAO_VERIFICADO"], "tolls", ["Fonte de pedágios", "Veículos"], "Origem e conciliação são verificáveis.", "P3", "GRANDE"),
  trace("WEB-FUNC-037", "Fornecedores", ["CONFIRMADO", "NAO_VERIFICADO"], "suppliers", ["Custos"], "Fornecedores são tenant-bound.", "P3", "MEDIO"),
  trace("WEB-FUNC-038", "Categorias", ["CONFIRMADO", "NAO_VERIFICADO"], "cost-categories", ["Custos"], "Categorias suportam classificação de custos real.", "P3", "MEDIO"),
  trace("WEB-FUNC-039", "Agendamento", ["CONFIRMADO", "NAO_VERIFICADO"], "maintenance-scheduling", ["Planos", "Executores"], "Agendamentos evitam conflitos e preservam auditoria.", "P2", "GRANDE"),
  trace("WEB-FUNC-040", "Planos", ["CONFIRMADO", "NAO_VERIFICADO"], "maintenance-plans", ["Veículos", "Critérios"], "Planos definem itens e vencimentos reproduzíveis.", "P2", "GRANDE"),
  trace("WEB-FUNC-041", "Departamentos de manutenção", ["CONFIRMADO", "NAO_VERIFICADO"], "maintenance-departments", ["Organização de manutenção"], "Departamentos são tenant-bound.", "P3", "MEDIO"),
  trace("WEB-FUNC-042", "Executores", ["CONFIRMADO", "NAO_VERIFICADO"], "maintenance-executors", ["Manutenção", "Permissões"], "Executor e histórico de atribuição são auditáveis.", "P3", "MEDIO"),
  trace("WEB-FUNC-043", "Reserva de veículos", ["CONFIRMADO", "NAO_VERIFICADO"], "reservations", ["Veículos", "Agenda", "Usuários"], "Reservas detectam conflitos e autorização.", "P3", "GRANDE"),
  trace("WEB-FUNC-044", "Formulários de checklist", ["CONFIRMADO", "NAO_VERIFICADO"], "checklist-forms", ["Checklist versionado"], "Formulários mantêm versões imutáveis após execução.", "P2", "GRANDE"),
  trace("WEB-FUNC-045", "Tabela de opções", ["CONFIRMADO", "NAO_VERIFICADO"], "checklist-options", ["Formulários"], "Opções são vinculadas a itens versionados.", "P3", "MEDIO"),
  trace("WEB-FUNC-046", "Central de cadastros", ["CONFIRMADO", "NAO_VERIFICADO"], "registrations", ["Módulos de operação"], "Atalhos só expõem módulos autorizados e existentes.", "P3", "MEDIO"),
  trace("WEB-FUNC-047", "Dashboard operacional", ["CONFIRMADO", "NAO_VERIFICADO"], "dashboard", ["API de dashboard", "API de veículos"], "Dashboard autenticado usa dados da API Zerith.", "P0", "MEDIO"),
  trace("WEB-FUNC-048", "Filtros e severidade da torre", ["CONFIRMADO", "NAO_VERIFICADO"], "control-tower", ["Eventos", "Severidade"], "Filtagem e ponderação possuem critérios próprios publicados.", "P1", "GRANDE"),
  trace("WEB-FUNC-049", "Notificações", ["CONFIRMADO", "NAO_VERIFICADO"], "alerts", ["Alertas", "Preferências"], "Notificações não alegam preferência persistida antes do backend.", "P2", "GRANDE"),
];
