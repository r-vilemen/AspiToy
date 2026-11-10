# Plano Técnico de Sprints — AspiToy

## Visão Geral dos Sprints

- **Sprint 1**: Fundação Visual e Interação (Em execução)
- **Sprint 2**: Inteligência e Navegação (Grade de ocupação, A*, replanejamento e exploração)
- **Sprint 3**: Limpeza Inteligente (Sujeira dinâmica, priorização, progresso real e bateria)
- **Sprint 4**: Interação Avançada (Seleção de regiões/cômodos, expressões avançadas, histórico e feedback contextual)
- **Sprint 5**: Refinamento e Entrega (Polimento visual, otimização, testes E2E e documentação final)

---

## Detalhamento Técnico do Sprint 1 — Fundação Visual e Interação

### Dia 1 — Setup e Arquitetura
- **Objetivo**: Configurar o projeto React 19 + Vite + TypeScript + Tailwind CSS + Zustand + React Three Fiber, criar toda a estrutura modular de diretórios, contratos de tipos, stores de estado, layout HUD inicial e cena 3D base funcional.
- **Entregas**:
  1. Configuração completa de build, TypeScript estrito, Tailwind CSS 4 e Vitest.
  2. Documentação arquitetural (`README.md`, `AGENTS.md`, `docs/*`).
  3. Tipos fundamentais (`robot.ts`, `environment.ts`, `commands.ts`, `agent.ts`).
  4. Stores Zustand (`robotStore.ts`, `environmentStore.ts`, `commandStore.ts`) com bridge de alta frequência para 60 FPS.
  5. Utilitários matemáticos e de coordenadas (`math.ts`, `coordinates.ts`) com testes unitários.
  6. Layout principal (`Header.tsx`, `Dashboard.tsx`) e componentes de controle (`ControlPanel.tsx`, `StatusCard.tsx`, `BatteryIndicator.tsx`, `ProgressBar.tsx`).
  7. `Scene.tsx` configurada com `<Canvas shadows>`, iluminação inicial (`Lighting.tsx`), materiais compartilhados (`Materials.ts`) e visualização 3D inicial da sala com base de recarga e preview do AspiToy.

### Dia 2 — Construção da Casa
- **Objetivo**: Construir a sala de estar 3D cinematográfica completa.
- **Entregas**: `House.tsx`, `Floor.tsx`, `Walls.tsx`, `Furniture.tsx` (sofá, mesa de centro, tapete, estante/rack, plantas decorativas, janelas com luz volumétrica suave, porta de acesso, objetos decorativos e base de carregamento detalhada), ajuste fino de sombras e câmera.

### Dia 3 — Aspirador
- **Objetivo**: Construir o personagem robótico AspiToy completo e câmera em terceira pessoa.
- **Entregas**: `Robot.tsx`, `RobotModel.tsx` (corpo chanfrado, rodas, sensores ópticos, visor com olhos digitais expressivos), `RobotAnimations.ts`, `RobotEffects.tsx`, movimentação/rotação suaves com `delta` time e `FollowCamera.tsx` em terceira pessoa com interpolação amortecida.

### Dia 4 — Interação
- **Objetivo**: Consolidar a máquina de estados operacional e sincronização completa entre painel de controle, notificações e comportamento do robô.
- **Entregas**: Máquina de estados (`IDLE`, `EXPLORING`, `CLEANING`, `AVOIDING`, `RETURNING`, `RECHARGING`, `PAUSED`, `COMPLETED`), comandos de iniciar, pausar, retomar e retornar à base, notificações reativas e `CommandInput.tsx`.

### Dia 5 — Autonomia Inicial
- **Objetivo**: Integrar obstáculos identificáveis, sensores simulados, desvio básico e movimentação autônoma no Sprint 1.
- **Entregas**: `SensorSystem.ts`, `ObstacleDetector.ts`, `AgentController.ts` para navegação inicial com detecção de colisão por bounding boxes e raios sensores, testes automatizados e validação visual completa do Sprint 1.

---

## Riscos Técnicos Identificados e Mitigações

1. **Re-renderizações excessivas do React em 60 FPS**:
   - *Mitigação*: Uso de `robotMotionBridge` mutável lido diretamente dentro de `useFrame` e atualização do store React apenas em intervalos discretos (~4 Hz para telemetria numérica de coordenadas) ou mudanças de estado.
2. **Compatibilidade React 19 + React Three Fiber**:
   - *Mitigação*: Uso de `@react-three/fiber@^9.8.2` e `@react-three/drei@^10.7.9`, que suportam oficialmente React 19.
3. **Custo de sombras em WebGL**:
   - *Mitigação*: Limitação a 1 luz direcional principal projetando sombras (`shadow-mapSize` 2048x2048 com frustum ajustado à sala) combinada com iluminação hemisférica/ambiente e sombras de contato suaves.

