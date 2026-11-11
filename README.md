# AspiToy — Agente Inteligente de Limpeza Doméstica em 3D

> Experiência web 3D interativa cinematográfica simulando um aspirador robótico autônomo e expressivo operando em uma residência contemporânea.

![AspiToy Status](https://img.shields.io/badge/Status-Sprint%201%20a%205%20Conclu%C3%ADdos-10B981)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8%20Strict-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Three.js](https://img.shields.io/badge/Three.js-0.187-black)
![Vitest](https://img.shields.io/badge/Tests-18%20Passed-success)

---

## 1. Visão do Projeto

O **AspiToy** não é um dashboard administrativo convencional nem um tutorial estático de Three.js. Trata-se de uma aplicação imersiva de animação 3D inspirada na linguagem visual dos estúdios Pixar/Toy Story, onde um personagem robótico carismático dotado de inteligência artificial autônoma (percepção sensorial, máquina de estados, grade de ocupação e algoritmo A*) explora a sala, identifica sujeira, desvia de móveis e responde a comandos do usuário.

---

## 2. Destaques da Implementação

- **Arquitetura Desacoplada em 3 Camadas**:
  - `src/components/`: HUD tátil com `Header`, `Dashboard`, `ControlPanel`, `StatusCard`, `CommandInput` e `ActivityLog`.
  - `src/agent/`: Agente puro TypeScript com máquina de estados finita (8 estados operacionais), percepção ToF/LIDAR simulada, grade de ocupação 2D e planejador de caminhos A*.
  - `src/world/`: Mundo 3D cinematográfico com piso de madeira em tábuas alternadas, paredes em corte com grandes janelas de vidro físico, mobiliário completo (sofá de linho, mesa de centro com café, rack com TV e livros, Monstera em cerâmica, luminária de latão) e personagem **AspiToy** com olhos digitais reativos, rodas funcionais e oscilação orgânica.
- **Performance a 60 FPS**:
  - Zero chamadas a `setState` em `useFrame` (Regra de Ouro `perf-never-set-state-in-useframe`).
  - Bridge mutável `robotMotionBridge` para transformações em alta frequência.
  - Telemetria React sincronizada discretamente a ~4 Hz para manter a interface leve e responsiva.
- **Controle e Interação Contextual**:
  - Iniciar, Pausar, Retomar, Retornar à Base e Reiniciar Simulação.
  - Seleção e priorização de regiões da sala (*Tapete Central*, *Canto da Janela*, *Área da Estante*).
  - Entrada de instruções rápidas por linguagem natural (`CommandInput`).
  - Retorno automático de emergência quando a bateria atinge nível crítico (<= 18%).
  - Câmera em terceira pessoa com 3 modos: `Acompanhar`, `Visão geral` e `Personagem`.

---

## 3. Estrutura do Repositório

```text
src/
├── agent/            # Agente inteligente (percepção, navegação A*, tomada de decisão)
│   ├── decision/     # Gerenciamento de prioridade de sujeira e bateria
│   ├── navigation/   # GridMap 2D, PathPlanner A*, ObstacleDetector
│   └── perception/   # SensorSystem ToF / LIDAR simulado
├── components/       # Interface de usuário (HUD, Controles, Histórico)
├── world/            # Renderização 3D (React Three Fiber / Three.js)
│   ├── Camera/       # FollowCamera em terceira pessoa com amortecimento
│   ├── Environment/  # Lighting cinematográfico e materiais PBR compartilhados
│   ├── House/        # Floor, Walls, Furniture e montagem da sala
│   └── Robot/        # Robot, RobotModel, RobotAnimations, RobotEffects
├── store/            # Stores Zustand (robotStore, environmentStore, commandStore)
├── types/            # Contratos TypeScript de domínio
├── utils/            # Matemática vetorial, interpolação e coordenadas mundo-grade
└── styles/           # Estilos globais e tokens visuais Tailwind v4
```

---

## 4. Como Executar

### Pré-requisitos
- Node.js `v20+` (desenvolvido e testado em Node `v24.14.0`)
- npm `v10+`

### Comandos

```bash
# 1. Instalar dependências
npm install

# 2. Executar em modo desenvolvimento
npm run dev

# 3. Executar suíte de testes unitários
npm test

# 4. Checagem de tipagem estrita
npm run lint

# 5. Gerar build otimizado de produção
npm run build
```

---

## 5. Documentação Técnica

- [`docs/MASTER_PROMPT.md`](./docs/MASTER_PROMPT.md) — Requisitos originais completos do projeto
- [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md) — Especificação de produto e identidade visual
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Arquitetura desacoplada em 3 camadas e estratégias de 60 FPS
- [`docs/SPRINT_PLAN.md`](./docs/SPRINT_PLAN.md) — Planejamento detalhado dos 5 Sprints
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — Registro de Decisões Arquiteturais (ADRs)
- [`docs/PROGRESS.md`](./docs/PROGRESS.md) — Acompanhamento do progresso de implementação
