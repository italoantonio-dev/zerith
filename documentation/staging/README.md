# Zerith staging v0.5

## Escopo e estado

Este diretório prepara a publicação em uma VPS Ubuntu LTS sem iniciar Docker Desktop, acessar uma VPS, aplicar migrações ou publicar imagens. Ele preserva `docker-compose.yml`, `docker-compose.local.yml` e `docs/`.

**Estado de publicação: NO-GO.** O `npm audit --omit=dev` atual retornou 6 vulnerabilidades altas e 4 moderadas. A correção disponível para parte relevante exige atualização maior de Tailwind e React Router; não foi aplicada porque alteraria dependências/lockfile fora desta tarefa. A conta de demonstração atual é única, portanto a exigência de autenticação individual para 4 membros e até 6 convidados também permanece sem mecanismo verificado de provisionamento.

## Arquitetura proposta

```text
Internet (80/443)
        |
      Caddy (TLS automático, headers, único serviço exposto)
      /                         \
/zehit/*                         /api/*
    |                               |
Nginx estático                    Spring Boot API
(frontend Vite)                     |
                               PostgreSQL 17

Caddy: redes public + private
Web: public somente
API e PostgreSQL: private (internal: true)
PostgreSQL: sem porta publicada
API: sem porta publicada
```

- `proxy` é o único serviço com `ports`; recebe 80/443, obtém/renova certificados via ACME e rejeita caminhos fora de `/zehit/`, `/api/*` e `/healthz`.
- A aplicação continua sob o basename legado confirmado no código: **`/zehit/`**. Não há migração silenciosa para `/zerith/`; uma eventual correção de nome exige decisão de produto e redirecionamentos compatíveis.
- O frontend recebe `VITE_API_URL=/api/v1` durante o build: a chamada é same-origin HTTPS. O backend também mantém CORS explicitamente limitado a `https://${STAGING_DOMAIN}` para qualquer cliente cross-origin futuro.
- `application-staging.yml` desabilita `flyway clean`, valida migrações antes de aplicá-las, respeita cabeçalhos encaminhados do proxy e não expõe detalhes do health.
- O seed existente é explicitamente sintético: `ZERITH_SEED_ENABLED=true` e `ZERITH_DEMO_DATASET_ENABLED=true`; o dataset identifica telemetria como `DEMONSTRATION`.

## Dimensionamento inicial

VPS recomendada: Ubuntu Server LTS, 2 vCPU, 4 GB RAM, SSD de 40–60 GB, IPv4 público.

| Serviço | Limite configurado | CPU configurada | Observação |
|---|---:|---:|---|
| PostgreSQL | 768 MB | 0,75 | volume `zerith_staging_postgres` persistente |
| API | 896 MB | 1,00 | heap Java limitado por `MaxRAMPercentage=60` |
| Frontend Nginx | 128 MB | 0,25 | apenas assets estáticos |
| Caddy | 160 MB | 0,25 | TLS e proxy |
| Total de limites | 1.952 MB | 2,25 | manter aproximadamente 2 GB para SO, page cache e picos |

Os limites são uma contenção inicial, não uma prova de desempenho. O monitoramento durante o ensaio de 15 min decide se o heap/API ou PostgreSQL precisa de ajuste.

## Arquivos de infraestrutura

| Arquivo | Finalidade |
|---|---|
| `deploy/staging/docker-compose.staging.yml` | stack isolado para staging; redes, volumes, health checks, logs, recursos e restart |
| `deploy/staging/Dockerfile.web` | build reprodutível com `npm ci` e Nginx para os assets de `/zehit/` |
| `deploy/staging/nginx.conf` | fallback SPA e cache de assets com hash |
| `deploy/staging/Caddyfile` | HTTPS, headers, proxy e rota de health externa |
| `backend/Dockerfile.staging` | imagem Java 21 não-root com `curl` para health check |
| `backend/src/main/resources/application-staging.yml` | hardening de Flyway/health e proxy headers |
| `deploy/staging/scripts/*.sh` | backup e recuperação protegida por confirmação explícita |
| `deploy/staging/k6/staging-load.js` | carga autenticada controlada (1/4/10 VUs) |

## Variáveis

Copie `deploy/staging/.env.staging.example` para **`/opt/zerith/staging.env`** na VPS, preencha localmente e aplique `chmod 600 /opt/zerith/staging.env`. O arquivo real é ignorado pelo Git e nunca deve ser copiado ao repositório.

| Variável | Obrigatória | Uso |
|---|---|---|
| `STAGING_DOMAIN` | sim | DNS público sem protocolo; usado por Caddy e CORS |
| `ACME_EMAIL` | sim | contato ACME, não é senha |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | sim | banco persistente; senha única de staging |
| `JWT_SECRET` | sim | mínimo 32 bytes aleatórios; assina tokens |
| `JWT_EXPIRATION_MINUTES` | não | padrão 480; reduzir se a homologação exigir |
| `ZERITH_DEMO_PASSWORD` | sim | senha exclusiva da demonstração sintética |
| `ZERITH_DEVICE_KEY` | sim | credencial exclusiva do dispositivo sintético |

Gere segredos na VPS, por exemplo `openssl rand -base64 48`, e não os coloque no histórico do shell, screenshots ou logs. Rotacione todos os valores se algum foi enviado por canal não seguro.

## Provisionamento inicial da VPS

1. Criar VPS Ubuntu LTS com 2 vCPU/4 GB/40–60 GB, IPv4 fixo e chave SSH individual. Desabilitar autenticação SSH por senha e login direto de root.
2. No firewall do provedor e UFW, permitir apenas `22/tcp` (preferencialmente IP administrativo), `80/tcp` e `443/tcp`. Não liberar 5432, 8081 ou 8080.
3. Instalar Docker Engine e o plugin Docker Compose seguindo a documentação oficial do Docker para a versão Ubuntu escolhida. Confirmar `docker compose version`.
4. Criar usuário operacional com acesso restrito ao Docker; criar `/opt/zerith` e o diretório de backup fora do repositório, ambos com permissões restritas.
5. Configurar DNS `A` de `STAGING_DOMAIN` para o IPv4 antes de iniciar Caddy. ACME exige que 80/443 estejam acessíveis.
6. Clonar uma revisão Git aprovada em `/opt/zerith/app`. Não copie `.env` local e não reutilize banco local.
7. Criar `/opt/zerith/staging.env` a partir do exemplo sem registrar valores; `chmod 600`.

## Deploy inicial

A partir de `/opt/zerith/app/deploy/staging`:

```sh
export STAGING_ENV_FILE=/opt/zerith/staging.env
# Examina estrutura/interpolação; não imprima "docker compose config" porque exibiria segredos.
docker compose --env-file "$STAGING_ENV_FILE" -f docker-compose.staging.yml config --quiet

docker compose --env-file "$STAGING_ENV_FILE" -f docker-compose.staging.yml build --pull
# Flyway é aplicado pela API somente após PostgreSQL saudável.
docker compose --env-file "$STAGING_ENV_FILE" -f docker-compose.staging.yml up -d

docker compose --env-file "$STAGING_ENV_FILE" -f docker-compose.staging.yml ps
curl --fail --silent --show-error "https://${STAGING_DOMAIN}/healthz"
curl --fail --silent --show-error "https://${STAGING_DOMAIN}/zehit/" >/dev/null
```

Antes de liberar testadores, confirme que os containers estão `healthy`, que `docker compose logs --tail=100 api` não contém falha de Flyway e que uma rota protegida sem Bearer responde 401 via proxy. Não exiba tokens nem use `docker compose config` sem `--quiet`.

## Atualização e rollback

1. Agendar janela, registrar a imagem/revisão atual e executar backup válido antes de mudar qualquer container.
2. Atualização: buscar revisão aprovada; executar `config --quiet`, `build --pull`, `up -d`; aguardar health e testar login/rota protegida com uma conta sintética.
3. Rollback de aplicação: voltar apenas para a revisão/imagem anterior e executar `up -d`. **Não execute rollback se a revisão nova tiver aplicado migração incompatível.**
4. Flyway é aditivo neste projeto; rollback do container não reverte schema nem dados. Para recuperação de banco, usar um backup compatível e restaurar em janela controlada.
5. Para alterações de schema futuras, exigir antes: backup testado, plano de compatibilidade da aplicação anterior e decisão explícita sobre reversão de dados.

## Backup e restauração

Backup diário, retenção inicial sugerida 14 dias: 7 diários + 4 semanais + 3 mensais; uma cópia criptografada fora da VPS. Monitorar idade do último backup e espaço livre.

```sh
cd /opt/zerith/app/deploy/staging
export STAGING_ENV_FILE=/opt/zerith/staging.env
export BACKUP_DIR=/opt/zerith/backups
./scripts/backup-postgres.sh
```

Teste mensalmente restauração em uma VPS/banco de recuperação isolado, nunca sobre a instância usada pelos testadores. O script de restauração exige `CONFIRM_STAGING_RESTORE=ERASE_AND_RESTORE`; ele é destrutivo para o banco selecionado.

```sh
# Somente em ambiente de recuperação isolado, após validar o arquivo e destino.
export STAGING_ENV_FILE=/opt/zerith/staging.env
export RESTORE_FILE=/opt/zerith/backups/zerith-staging-YYYYMMDDTHHMMSSZ.dump
export CONFIRM_STAGING_RESTORE=ERASE_AND_RESTORE
./scripts/restore-postgres.sh
```

Após restaurar: iniciar stack, verificar health, confirmar tabela `flyway_schema_history`, login sintético, dashboard e rastreamento. Documentar RPO real (idade do último dump) e RTO observado no ensaio; ainda não há medição.

## Teste de carga controlado

Não executar fora do domínio staging autorizado e não apontar para terceiros. Criar antes uma conta sintética exclusiva de carga, sem permissão operacional e sem compartilhar a senha no script. Na VPS/runner administrativo com k6 instalado:

```sh
export BASE_URL=https://staging.example.com
export TEST_EMAIL=conta-sintetica-de-carga@example.com
export TEST_PASSWORD=CHANGE_ME_TEST_PASSWORD
export DURATION=15m
for VUS in 1 4 10; do
  export VUS
  k6 run --summary-export="/opt/zerith/benchmarks/k6-${VUS}vu.json" staging-load.js
  sleep 300
 done
```

Para cada ensaio registrar: `http_req_duration` p50/p95, `dashboard_api_duration` p50/p95, `tracking_api_duration` p50/p95, `http_req_failed`, `api_errors`, CPU/RAM por container (`docker stats --no-stream`) no início/meio/fim e métricas do host (`free -m`, `df -h`).

O script mede API do dashboard e tracking/mapa. Para o carregamento de página Dashboard e mapa no navegador, registrar em sessão autenticada separada o DevTools Performance/Network ou Playwright aprovado: URL, cache frio/quente, navegador, resolução, tempo de `load`, LCP e requisições que falharam. A API saudável não substitui esse ensaio visual autenticado.

Critérios iniciais de homologação: 15 min completos por nível, erro HTTP/API <1%, sem restart/OOM, p95 API <1,5 s e sem degradação progressiva de CPU/RAM. São metas iniciais, não SLOs de produção.

## Checklist de segurança GO/NO-GO

- [ ] Revisão de `npm audit --omit=dev`: 0 vulnerabilidades críticas/altas com superfície de produção não mitigada; registrar decisão para moderadas.
- [ ] Segredos gerados na VPS, fora do Git, permissões 600 e sem valores em CI/logs.
- [ ] Rotacionadas credenciais demo/JWT/DB se expostas em qualquer canal inseguro.
- [ ] DNS correto e certificado HTTPS válido; HTTP redireciona para HTTPS.
- [ ] Firewall permite somente SSH administrativo, 80 e 443.
- [ ] `docker compose ps` prova que API/DB não publicam portas ao host.
- [ ] Cada testador possui conta individual, tenant e regra de revogação; sem senha compartilhada.
- [ ] Teste de isolamento confirma que conta A não lê veículo/alerta/posição do tenant B.
- [ ] Rota protegida retorna 401 sem token, 403 para autorização insuficiente quando houver regra aplicável; ingestão exige `X-Device-Key`.
- [ ] Flyway foi aplicado uma vez, `clean` está bloqueado e backup pré-deploy foi validado.
- [ ] Health checks verdes e logs rotacionados, sem JWT/senhas/chaves ou telemetria sensível.
- [ ] Backup automatizado, cópia externa e restauração isolada ensaiada.
- [ ] Carga 1/4/10 VUs por 15 min e verificação visual autenticada concluídas.
- [ ] Tarefa 20/Docker Desktop não é pré-requisito para VPS, mas qualquer mudança pendente de Compose/local foi reconciliada e revisada.

## Auditoria realizada nesta tarefa

### Configuração e perfis

- O frontend usa Vite/React, `npm`/`package-lock.json`, `vite build --outDir docs`, base e `BrowserRouter` em `/zehit/`. O build de staging é isolado em imagem e não altera `docs/` no host.
- API Java 21/Spring Boot 3.5.5; `application.yml` recebe banco, JWT e CORS por ambiente. Flyway está habilitado; as migrações encontradas são `V1__initial_schema.sql` e `V2__telemetry_data_origin.sql`.
- Compose local expõe PostgreSQL 5433 e API 8091 apenas em loopback. O Compose raiz atual expõe 5432/8081 em todas as interfaces e habilita seed; ele foi preservado, mas não é apropriado para VPS.
- O profile `demo` contém segredo de teste para H2. Não é incluído no profile staging; manter somente para testes e não reutilizar fora deles.

### Credenciais e Git

- `.env` e `backend/.env` estão ignorados; nenhum arquivo `.env`, `.pem`, `.key`, `.p12` ou `.pfx` foi encontrado rastreado. Valores não foram lidos.
- O worktree já estava substancialmente alterado antes desta tarefa: há diferenças staged, unstaged e arquivos não rastreados, incluindo artefatos em `docs/`. Esta tarefa não os reconciliou.
- `git diff --check` apontou whitespace em um asset JavaScript staged de `docs/`, pré-existente e fora desta alteração. É bloqueador de uma candidatura de release até regeneração/revisão.

### JWT, CORS e multi-tenancy

- `SecurityConfig` protege todas as rotas exceto auth, ingestão de dispositivo e health; tokens Bearer inválidos retornam 401 e acesso negado retorna 403.
- JWT é assinado HS256, expira conforme ambiente e o filtro recarrega usuário ativo/tenant do banco antes de autenticar.
- Controladores de veículos, tracking, dashboard e alertas precisam manter `tenant_id` derivado de `UserPrincipal`; os controladores inspecionados de veículo/tracking aplicam esse predicado no boundary JDBC. Ingestão deriva tenant/dispositivo pela chave e mantém unicidade `(device_id, sequence_number)`.
- A política CORS atual permite métodos necessários, origem explícita e credentials; staging fixa a origem HTTPS do domínio.

### Riscos e bloqueadores conhecidos

1. **NO-GO — dependências:** auditoria `npm audit --omit=dev` retornou 6 altas e 4 moderadas. Rotas relevantes: Tailwind 3.4.x → chokidar/braces/micromatch/fast-glob/postcss; `react-router-dom` 6.26.2 → React Router (<7.18.0); `source-map-js` também alto. A correção automática sugerida é major para Tailwind 4.3.3 e React Router 7.18.4. Avaliação e atualização devem ser tarefa aprovada, com testes.
2. **NO-GO — participantes individuais:** seed atual cria uma única conta demo. Não foi encontrado fluxo verificado de provisionamento administrativo de 4+6 contas/tenants. Não usar a senha demo compartilhada; implementar/provar esse processo antes de convidar pessoas.
3. **GO condicionado — Java local:** a máquina atual tem JDK 25 no PATH, mas `JAVA_HOME` aponta para JDK 8 inexistente; Maven não iniciou. A VPS usará imagem Java 21, mas `mvn verify` local não pôde ser reexecutado nesta tarefa até corrigir o ambiente local ou usar CI Java 21.
4. **GO condicionado — Docker:** Docker Desktop segue bloqueado pela Tarefa 20; portanto Compose, build de imagens, ACME, health checks e CORS HTTPS foram preparados mas não executados. A VPS pode validar independentemente após contratação.
5. **GO condicionado — banco:** não houve migration contra banco existente; é obrigatório validar primeiro boot e `flyway_schema_history` em volume novo na VPS.

## Próximo passo

Antes de contratar/configurar VPS: abrir tarefa específica para atualização compatível das dependências altas, decidir e implementar provisionamento/revogação de contas individuais e obter aprovação da revisão de staging. Em seguida contratar VPS Ubuntu LTS conforme tamanho acima, criar DNS e executar o procedimento deste documento com uma revisão Git congelada.
