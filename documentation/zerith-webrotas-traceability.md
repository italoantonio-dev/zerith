# Zerith — rastreabilidade de navegação WebRotas

## Propósito e limites

Este documento registra o benchmark funcional usado para orientar a navegação Zerith V0.4. A referência é `docs/benchmarks/webrotas-audit/`, mas não transfere implementação, contrato, dados, fórmulas, identidade visual ou permissões de terceiros para o Zerith.

- **Fonte de referência:** auditoria WebRotas em 2026-10-13.
- **Estado Zerith:** independente da evidência do benchmark.
- **C:** confirmado na referência; **I:** inferido; **NV:** não verificado; **B:** bloqueado/parcial.
- **BETA:** rota Zerith já conectada a código/API, mas ainda sem validação visual autenticada recente.
- **EM DESENVOLVIMENTO:** rota existe somente como estado honesto; não possui operação, formulário, exportação ou métrica simulada.
- Rotas planejadas são protegidas por autenticação. Esta matriz não altera JWT, RBAC, CORS ou isolamento multi-tenant.

A fonte canônica executável é `src/config/navigation.ts`; esta tabela é a evidência documental correspondente.

| ID | Módulo Zerith / rota | Ref. | Estado | Dependências | Critério de aceite | Prioridade / esforço |
|---|---|---|---|---|---|---|
| WEB-FUNC-001 | Catálogo de relatórios — `/relatorios` | C, NV | EM DESENVOLVIMENTO | Manifesto de relatórios | Exibe somente estado e dependências reais | P2 / Médio |
| WEB-FUNC-002 | Viagens — `/relatorios/viagens` | C, I, NV | EM DESENVOLVIMENTO | Histórico GPS; regras de viagem | Contrato e critérios de consolidação publicados | P1 / Grande |
| WEB-FUNC-003 | Excesso de velocidade — `/relatorios/excesso-velocidade` | C, I, NV | EM DESENVOLVIMENTO | Eventos; limites | Limite, tolerância e origem auditáveis | P1 / Grande |
| WEB-FUNC-004 | Fora de expediente — `/relatorios/fora-expediente` | C, I, NV | EM DESENVOLVIMENTO | Expedientes; eventos; timezone | Janelas e tolerâncias documentadas | P2 / Grande |
| WEB-FUNC-005 | Anomalias — `/relatorios/anomalias` | C, I, NV | EM DESENVOLVIMENTO | Taxonomia de eventos | Regra explicável por anomalia | P2 / Grande |
| WEB-FUNC-006 | Ociosidade — `/relatorios/ocioso` | C, I, NV | EM DESENVOLVIMENTO | Ignição; GPS; limiar | Limiar de deslocamento e ignição publicado | P2 / Médio |
| WEB-FUNC-007 | Fora de temperatura — `/relatorios/temperatura` | C, NV | EM DESENVOLVIMENTO | Sensores; faixas térmicas | Faixas autorizadas por operação | P3 / Grande |
| WEB-FUNC-008 | Movimentação em cerca — `/relatorios/movimentacao-cerca` | C, I, NV | EM DESENVOLVIMENTO | Cercas; motor de eventos | Eventos calculados em geometrias válidas | P3 / Grande |
| WEB-FUNC-009 | Sensores — `/relatorios/sensores` | C, NV | EM DESENVOLVIMENTO | Contrato de sensores | Tipos e critérios definidos | P3 / Grande |
| WEB-FUNC-010 | Transmissões — `/relatorios/transmissoes` | C, NV | EM DESENVOLVIMENTO | Telemetria; retenção | Consulta paginada e tenant-bound | P2 / Médio |
| WEB-FUNC-011 | Jornada de trabalho — `/relatorios/jornada` | C, NV | EM DESENVOLVIMENTO | Expedientes; motoristas; veículos | Timezone e vínculos reais respeitados | P3 / Grande |
| WEB-FUNC-012 | Identificação — `/relatorios/identificacao` | C, I, NV | EM DESENVOLVIMENTO | Motoristas; CPF confirmado | Autoria e vínculo verificáveis | P2 / Grande |
| WEB-FUNC-013 | Aproximação — `/relatorios/aproximacao` | C, I, NV | EM DESENVOLVIMENTO | POIs; GPS | Distância de referência auditável | P3 / Grande |
| WEB-FUNC-014 | Emissão de CO₂ — `/relatorios/emissao-co2` | C, I, NV | EM DESENVOLVIMENTO | Combustível; metodologia | Fatores e fórmulas publicados | P3 / Grande |
| WEB-FUNC-015 | Gerencial — `/relatorios/gerencial` | C, I, NV | EM DESENVOLVIMENTO | Agregados; eventos | Fonte e fórmula de cada indicador | P2 / Grande |
| WEB-FUNC-016 | Hodômetro — `/relatorios/hodometro` | C, NV | EM DESENVOLVIMENTO | Leitura de odômetro | Origem e inconsistências tratadas | P3 / Médio |
| WEB-FUNC-017 | Horímetro — `/relatorios/horimetro` | C, I, NV | EM DESENVOLVIMENTO | Telemetria; horímetro | Acumulado e delta distinguíveis | P3 / Médio |
| WEB-FUNC-018 | Execuções de checklist — `/relatorios/execucoes-checklist` | B, NV | EM DESENVOLVIMENTO | Checklist versionado; CPF confirmado | Formulário, autor e veículo preservados | P2 / Grande |
| WEB-FUNC-019 | Mapa e trajetória — `/rastreamento` | C, I, NV | BETA | API GPS; MapLibre; tiles licenciados | Dados tenant-bound e rota real em QA autenticada | P0 / Médio |
| WEB-FUNC-020 | Dispositivos — `/rastreamento/dispositivos` | C, I, NV | EM DESENVOLVIMENTO | Modelo de dispositivo; veículos | Vínculo e estado reais | P2 / Grande |
| WEB-FUNC-021 | Torre de controle — `/rastreamento/torre` | C, NV | EM DESENVOLVIMENTO | Eventos; severidade | Categoria, severidade e autorização | P1 / Grande |
| WEB-FUNC-022 | Ranking operacional — `/rastreamento/ranking` | C, NV | EM DESENVOLVIMENTO | Eventos; critérios | Veículos avaliados com critério não disciplinar | P3 / Grande |
| WEB-FUNC-023 | Ponto base — `/rastreamento/ponto-base` | C, NV | EM DESENVOLVIMENTO | GPS; organização | Escopo tenant-bound | P3 / Médio |
| WEB-FUNC-024 | Compartilhamento — `/rastreamento/compartilhar` | C, NV | EM DESENVOLVIMENTO | Autorização; auditoria | Link expira, revoga e registra acesso | P3 / Grande |
| WEB-FUNC-025 | Veículos — `/veiculos` | C, NV | BETA | API de veículos | API retorna somente veículos do tenant | P0 / Médio |
| WEB-FUNC-026 | Frotas — `/frotas` | C, NV | EM DESENVOLVIMENTO | Entidade frota; veículos | Vínculos tenant-bound | P2 / Grande |
| WEB-FUNC-027 | Motoristas — `/motoristas` | C, NV | EM DESENVOLVIMENTO | CPF confirmado; veículos | Autoria e vínculos preservados | P2 / Grande |
| WEB-FUNC-028 | Departamentos — `/organizacao/departamentos` | C, NV | EM DESENVOLVIMENTO | Organização | Consultas limitadas ao tenant | P3 / Médio |
| WEB-FUNC-029 | Expedientes — `/organizacao/expedientes` | C, NV | EM DESENVOLVIMENTO | Timezone; organização | Regras de borda testadas | P3 / Grande |
| WEB-FUNC-030 | Centros de custo — `/organizacao/centros-custo` | C, NV | EM DESENVOLVIMENTO | Organização; custos | Escopo tenant-bound | P3 / Médio |
| WEB-FUNC-031 | Agentes — `/organizacao/agentes` | C, NV | EM DESENVOLVIMENTO | Modelo de agente; permissões | Papéis e operações definidos | P3 / Grande |
| WEB-FUNC-032 | Pontos de interesse — `/rastreamento/pontos-interesse` | C, NV | EM DESENVOLVIMENTO | Geolocalização | POIs isolados e geograficamente válidos | P3 / Grande |
| WEB-FUNC-033 | Cercas virtuais — `/rastreamento/cercas` | C, NV | EM DESENVOLVIMENTO | Geometrias; GPS | Geometria e isolamento validados | P3 / Grande |
| WEB-FUNC-034 | Lançamentos — `/custos/lancamentos` | C, NV | EM DESENVOLVIMENTO | Categorias; centros de custo | Fonte e autorização rastreáveis | P3 / Grande |
| WEB-FUNC-035 | Média de consumo — `/custos/consumo` | C, NV | EM DESENVOLVIMENTO | Abastecimentos; hodômetro | Método reproduzível documentado | P3 / Grande |
| WEB-FUNC-036 | Pedágios — `/custos/pedagios` | C, NV | EM DESENVOLVIMENTO | Fonte de pedágios; veículos | Origem e conciliação verificáveis | P3 / Grande |
| WEB-FUNC-037 | Fornecedores — `/custos/fornecedores` | C, NV | EM DESENVOLVIMENTO | Custos | Fornecedores tenant-bound | P3 / Médio |
| WEB-FUNC-038 | Categorias — `/custos/categorias` | C, NV | EM DESENVOLVIMENTO | Custos | Classificação operacional real | P3 / Médio |
| WEB-FUNC-039 | Agendamentos — `/manutencao/agendamentos` | C, NV | EM DESENVOLVIMENTO | Planos; executores | Conflitos e auditoria preservados | P2 / Grande |
| WEB-FUNC-040 | Planos — `/manutencao/planos` | C, NV | EM DESENVOLVIMENTO | Veículos; critérios | Itens e vencimentos reproduzíveis | P2 / Grande |
| WEB-FUNC-041 | Departamentos de manutenção — `/manutencao/departamentos` | C, NV | EM DESENVOLVIMENTO | Organização de manutenção | Escopo tenant-bound | P3 / Médio |
| WEB-FUNC-042 | Executores — `/manutencao/executores` | C, NV | EM DESENVOLVIMENTO | Manutenção; permissões | Executor e atribuição auditáveis | P3 / Médio |
| WEB-FUNC-043 | Reservas — `/operacao/reservas` | C, NV | EM DESENVOLVIMENTO | Veículos; agenda; usuários | Conflitos e autorização tratados | P3 / Grande |
| WEB-FUNC-044 | Formulários de checklist — `/operacao/formularios-checklist` | C, NV | EM DESENVOLVIMENTO | Checklist versionado | Versões imutáveis após execução | P2 / Grande |
| WEB-FUNC-045 | Tabelas de opções — `/operacao/tabelas-opcoes` | C, NV | EM DESENVOLVIMENTO | Formulários | Opções vinculadas a itens versionados | P3 / Médio |
| WEB-FUNC-046 | Central de cadastros — `/operacao/cadastros` | C, NV | EM DESENVOLVIMENTO | Módulos de operação | Só expõe módulos existentes/autorizados | P3 / Médio |
| WEB-FUNC-047 | Dashboard — `/dashboard` | C, NV | BETA | API dashboard; API veículos | Dados retornados pela API Zerith | P0 / Médio |
| WEB-FUNC-048 | Filtros/severidade da torre — `/rastreamento/torre` | C, NV | EM DESENVOLVIMENTO | Eventos; severidade | Critérios próprios publicados | P1 / Grande |
| WEB-FUNC-049 | Notificações — `/alertas` | C, NV | BETA para alertas; preferências em desenvolvimento | Alertas; preferências | Não alegar preferência persistida sem backend | P2 / Grande |

## Backlog incremental

1. **P0:** QA autenticada de Rastreamento, incluindo contrato de posições, GeoJSON, linha, marcadores, console e captura 16:9.
2. **P1:** contrato tenant-bound para eventos e Torre de Controle, incluindo severidade e filtros próprios.
3. **P2:** entidades fundamentais de motoristas com CPF confirmado, frotas e checklists versionados.
4. **P3:** custos, manutenção, relatórios especializados e inteligência somente após fonte, critérios e fórmulas aprovados.
