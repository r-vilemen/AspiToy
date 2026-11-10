# AspiToy

Experiência web interativa em 3D que simula um aspirador robótico inteligente e expressivo operando autonomamente dentro de uma sala de estar cinematográfica.

## Visão Geral

O **AspiToy** combina uma direção de arte inspirada no cinema de animação 3D (iluminação natural aconchegante, materiais estilizados e um personagem robótico com personalidade própria) com uma arquitetura desacoplada de agente autônomo (percepção, navegação, tomada de decisão e máquina de estados operacional).

## Stack Tecnológica

- **Front-end**: React 19, Vite 6, TypeScript 5.8, Tailwind CSS 4, Lucide React
- **Estado Compartilhado**: Zustand 5 (com separação entre estado de UI e referências mutáveis de alta frequência para 60 FPS)
- **Renderização 3D**: Three.js (`0.187+`), React Three Fiber (`@react-three/fiber` v9), React Three Drei (`@react-three/drei` v10)
- **Testes**: Vitest, React Testing Library

## Estrutura de Diretórios

```text
src/
├── app/            # Componente raiz e providers da aplicação
├── components/     # Interface React (Header, Dashboard e controles táteis)
├── world/          # Mundo 3D (Scene, House, Robot, Camera, Environment)
├── agent/          # Agente inteligente desacoplado da camada visual
├── store/          # Stores Zustand (robotStore, environmentStore, commandStore)
├── types/          # Contratos TypeScript do domínio
├── hooks/          # Seletores e hooks de integração
├── utils/          # Funções matemáticas e conversão de coordenadas
└── styles/         # Estilos globais e tokens visuais
```

## Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Executar testes automatizados
npm test

# Gerar build de produção
npm run build
```

## Documentação do Projeto

- [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md) — Especificação de produto e direção de arte
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Arquitetura em 3 camadas e padrões de desempenho
- [`docs/SPRINT_PLAN.md`](./docs/SPRINT_PLAN.md) — Planejamento detalhado dos Sprints e do Sprint 1
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — Registro de decisões arquiteturais e técnicas (ADRs)
- [`docs/PROGRESS.md`](./docs/PROGRESS.md) — Acompanhamento incremental das entregas

