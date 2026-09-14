# ZERITH — Plataforma de Telemática Preditiva para Frotas

> Dashboard inteligente de monitoramento de frotas com manutenção preditiva baseada em IA, alertas em tempo real e análise de sensores veiculares.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## Sobre o Projeto

A ZERITH é uma startup de telemática preditiva para gestão de frotas leves, desenvolvida para antecipar falhas mecânicas, reduzir custos operacionais e centralizar o monitoramento da frota em um único painel.

Este repositório contém o **MVP integrado**: dashboard React, API Spring Boot, PostgreSQL e firmware de demonstração para ESP32.

**Contexto:** Projeto aprovado na Etapa 6 do programa Brasil Inovador (Assistec Inova, 2026). Arquitetura completa: ESP32 + OBD-II (hardware), Spring Boot (backend), Python FastAPI (ML), Oracle Cloud (infraestrutura).

---

## Funcionalidades

- Painel de monitoramento em tempo real por veículo
- Alertas inteligentes de risco de manutenção preditiva
- Gráficos interativos com dados de sensores (Recharts)
- Sistema de autenticação com controle de acesso
- Interface responsiva com tema dark/light

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Estilo | Tailwind CSS + shadcn/ui |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Roteamento | React Router DOM |
| Backend | Java 21 + Spring Boot |
| Banco | PostgreSQL + Flyway |
| Hardware | ESP32 (firmware de demonstração) |
| Deploy do frontend | GitHub Pages |

---

## Como Rodar Localmente

**Pré-requisitos:** Node.js 18+, npm ou yarn

```bash
# Clone o repositório
git clone https://github.com/italoantonio-dev/zerith.git
cd zerith

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173`

---

## Executar o MVP completo

Consulte [backend/README.md](backend/README.md) para iniciar PostgreSQL, API, dashboard e simular uma leitura do ESP32.

---

## Deploy

O projeto está configurado para GitHub Pages. Para publicar:

```bash
npm run build
# Os arquivos gerados em /docs são publicados automaticamente
```

---

## Arquitetura Completa (ZERITH)

```
ESP32 + OBD-II  →  MQTT/Mosquitto  →  Spring Boot API
                                            ↓
                                    Oracle Cloud DB
                                            ↓
                              Python FastAPI (ML preditivo)
                                            ↓
                                   React Dashboard (este repo)
```

---

## Roadmap

- [x] Dashboard base com autenticação
- [x] Gráficos de sensores em tempo real
- [x] Sistema de alertas
- [x] Integração inicial com backend Spring Boot
- [ ] Conexão com pipeline ML (FastAPI)
- [ ] App mobile (React Native)
- [x] Firmware ESP32 simulador para o MVP
- [ ] Adaptador OBD-II e validação em veículo
- [ ] Hardware ESP32 + OBD-II em produção

---

## Sobre a ZERITH

Startup de telemática preditiva para frotas leves. Co-fundadores: Italo Antonio (CEO), Otávio Faleiros (CPO) e Thales Felix (CTO Hardware).

- Modelo SaaS a partir de R$ 69/placa/mês
- Seed target: R$ 350k por 15% de equity
- Programa: Brasil Inovador — Assistec Inova (Etapa 6, 2026)

---

## Contato

**Italo Antonio** — [LinkedIn](https://linkedin.com/in/italo-ti) · [GitHub](https://github.com/italoantonio-dev)
