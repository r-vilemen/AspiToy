# Progresso de Desenvolvimento — AspiToy

## Status Geral por Sprint

- [x] **Planejamento Técnico Inicial (Seção 19)** — Concluído
- [x] **Sprint 1 — Fundação Visual e Interação** — CONCLUÍDO COM SUCESSO
- [ ] **Sprint 2 — Inteligência e Navegação** (Próximo Sprint a iniciar)
- [ ] **Sprint 3 — Limpeza Inteligente** (Pendente)
- [ ] **Sprint 4 — Interação Avançada** (Pendente)
- [ ] **Sprint 5 — Refinamento e Entrega** (Pendente)

---

## Sprint 1 — Fundação Visual e Interação (100% Concluído)

### [x] Dia 1 — Setup e Arquitetura
- [x] Projeto React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS v4 + Vitest configurado.
- [x] Documentação arquitetural em `docs/` (`ARCHITECTURE.md`, `PRODUCT_SPEC.md`, `DECISIONS.md`, `SPRINT_PLAN.md`, `PROGRESS.md`).
- [x] Stores Zustand (`robotStore`, `environmentStore`, `commandStore`) com `robotMotionBridge` para 60 FPS sem re-renderizações por frame.
- [x] Componentes de HUD tátil (`StatusCard`, `ControlPanel`, `BatteryIndicator`, `ProgressBar`).

### [x] Dia 2 — Construção da Casa
- [x] Piso de madeira laminada com variação de tábuas em *running bond* (`src/world/House/Floor.tsx`).
- [x] Paredes arquitetônicas com cortes cinematográficos, esquadrias brancas, vidro físico translúcido e porta semiaberta (`src/world/House/Walls.tsx`).
- [x] Mobiliário estilizado: sofá de linho cru com almofadas, mesa de centro contemporânea com tampo de vidro, tapete central, estante/rack de TV, vaso com planta *Monstera Deliciosa*, luminária em latão e base de recarga detalhada (`src/world/House/Furniture.tsx`).
- [x] Iluminação cinematográfica com sombras direcionais nítidas, luz hemisférica e sombras de contato suaves (`src/world/Environment/Lighting.tsx`).

### [x] Dia 3 — Aspirador
- [x] Modelo 3D de alta expressividade `RobotModel.tsx`: chassi chanfrado, bumper frontal articulado, rodas funcionais com pneus de borracha, rodízio frontal, torre LIDAR 360 e visor frontal com olhos digitais dinâmicos.
- [x] Locomoção orgânica `RobotAnimations.ts`: oscilação natural (*bobbing*), rotação suave amortecida, pitch ao acelerar/frear e roll em curvas acentuadas.
- [x] Efeitos visuais `RobotEffects.tsx` com anel luminoso e pulso de aspiração.
- [x] Câmera em terceira pessoa amortecida `FollowCamera.tsx` com 3 presets (`Acompanhar`, `Visão geral`, `Personagem`).

### [x] Dia 4 — Interação
- [x] Máquina de estados completa (`IDLE`, `EXPLORING`, `CLEANING`, `AVOIDING`, `RETURNING`, `RECHARGING`, `PAUSED`, `COMPLETED`).
- [x] Controles de Iniciar, Pausar, Retomar, Retornar à Base e Reiniciar Simulação com validação de estados incompatíveis.
- [x] Caixa de entrada por linguagem natural `CommandInput.tsx` (interpreta instruções de texto como "limpar tapete", "ir à base", "pausar").
- [x] Sistema de notificações contextuais na UI com histórico e descarte interativo.

### [x] Dia 5 — Autonomia Inicial
- [x] Detector de obstáculos puro TypeScript `src/agent/navigation/ObstacleDetector.ts` com cálculo de proximidade e colisão em bounding boxes 2D.
- [x] Sistema de sensores simulados ToF / LIDAR `src/agent/perception/SensorSystem.ts` com varredura em leque angular frontal.
- [x] Controlador autônomo desacoplado `src/agent/AgentController.ts` que calcula velocidade e manobra evasiva em tempo real.
- [x] Integração completa entre o agente e a cena 3D.
- [x] Bateria de testes de unidade e componentes (13 testes aprovados, build 100% verde).

---

## Próximo Passo: Início do Sprint 2 — Inteligência e Navegação

### Entregas previstas do Sprint 2:
1. **Grade de Ocupação (`GridMap.ts`)**: Mapeamento discreto do piso da sala em células navegáveis, bloqueadas e exploradas.
2. **Algoritmo A\* (`PathPlanner.ts`)**: Planejamento de rotas ótimas sem colisão com móveis ou paredes.
3. **Replanejamento Dinâmico de Trajetória**: Recálculo automático quando o caminho for obstruído.
4. **Sistema de Exploração Autônoma**: Identificação e cobertura metódica de regiões desconhecidas.
5. **Sincronização Visual de Rota**: Representação visual sutil do trajeto planejado no piso.
