# Progresso de Desenvolvimento — AspiToy

## Status Geral por Sprint

- [x] **Planejamento Técnico Inicial (Seção 19)** — Concluído
- [ ] **Sprint 1 — Fundação Visual e Interação** (Em andamento: Dia 1 concluído)
- [ ] **Sprint 2 — Inteligência e Navegação** (Pendente)
- [ ] **Sprint 3 — Limpeza Inteligente** (Pendente)
- [ ] **Sprint 4 — Interação Avançada** (Pendente)
- [ ] **Sprint 5 — Refinamento e Entrega** (Pendente)

---

## Sprint 1 — Detalhamento de Tarefas

### [x] Dia 1 — Setup e Arquitetura (CONCLUÍDO)
- [x] 1. Verificar o ambiente de desenvolvimento (`Node v24.14.0`, `npm 11.19.0`).
- [x] 2. Criar projeto React 19 com Vite 6 e TypeScript 5.8.
- [x] 3. Configurar dependências (`three`, `@react-three/fiber`, `@react-three/drei`, `zustand`, `lucide-react`, `vitest`).
- [x] 4. Configurar Tailwind CSS v4 (`@tailwindcss/vite`) e tokens tipográficos/cromáticos.
- [x] 5. Configurar Zustand (`robotStore`, `environmentStore`, `commandStore`) com `robotMotionBridge` para 60 FPS sem re-renderizações por frame.
- [x] 6. Criar estrutura modular de pastas (`app`, `components`, `world`, `store`, `types`, `hooks`, `utils`, `styles`, `docs`).
- [x] 7. Criar aplicação principal (`App.tsx`, `Dashboard.tsx`, `Header.tsx`).
- [x] 8. Configurar `Canvas` R3F com sombras, iluminação cinematográfica inicial e palco 3D base (`Scene.tsx`, `Lighting.tsx`, `Materials.ts`).
- [x] 9. Criar layout inicial tátil (`StatusCard.tsx`, `ControlPanel.tsx`, `BatteryIndicator.tsx`, `ProgressBar.tsx`).
- [x] 10. Validar execução com testes automatizados (`vitest`) e build de produção (`tsc -b && vite build`).

### [ ] Dia 2 — Construção da Casa (PRÓXIMA TAREFA PENDENTE)
- [ ] 1. Criar piso detalhado (`src/world/House/Floor.tsx`).
- [ ] 2. Criar paredes com acabamentos e rodapés (`src/world/House/Walls.tsx`).
- [ ] 3. Criar sofá detalhado com almofadas e pés de madeira.
- [ ] 4. Criar mesa de centro com objetos decorativos.
- [ ] 5. Criar tapete texturizado com borda.
- [ ] 6. Criar estante/rack com objetos, livros e tela.
- [ ] 7. Criar janelas com molduras, vidro e entrada de luz natural + porta de acesso.
- [ ] 8. Refinar iluminação cinematográfica e plantas decorativas (`src/world/House/Furniture.tsx`, `src/world/House/House.tsx`).
- [ ] 9. Configurar sombras suaves e contato.
- [ ] 10. Configurar enquadramento de câmera para valorizar profundidade e escala.

### [ ] Dia 3 — Aspirador (Pendente)
- [ ] 1. Criar corpo detalhado do aspirador (`src/world/Robot/RobotModel.tsx`).
- [ ] 2. Criar rodas funcionais animadas.
- [ ] 3. Criar sensores visíveis e bumper frontal.
- [ ] 4. Criar olhos digitais expressivos reativos ao estado.
- [ ] 5. Implementar movimentação suave com aceleração e desaceleração (`src/world/Robot/Robot.tsx`).
- [ ] 6. Implementar rotação amortecida.
- [ ] 7. Criar animações e efeitos (`src/world/Robot/RobotAnimations.ts`, `src/world/Robot/RobotEffects.tsx`).
- [ ] 8. Implementar câmera dedicada em terceira pessoa (`src/world/Camera/FollowCamera.tsx`).

### [ ] Dia 4 — Interação (Pendente)
- [ ] 1. Consolidar máquina de estados completa e transições seguras.
- [ ] 2. Implementar comando iniciar com feedback completo.
- [ ] 3. Implementar comando pausar.
- [ ] 4. Implementar comando retomar.
- [ ] 5. Implementar comando de retorno à base.
- [ ] 6. Sincronizar painel lateral e `CommandInput.tsx`.
- [ ] 7. Implementar sistema de notificações contextuais e histórico.

### [ ] Dia 5 — Autonomia Inicial (Pendente)
- [ ] 1. Criar obstáculos identificáveis sincronizados com a geometria da sala (`src/agent/navigation/ObstacleDetector.ts`).
- [ ] 2. Implementar sensores simulados (`src/agent/perception/SensorSystem.ts`, `EnvironmentScanner.ts`).
- [ ] 3. Implementar desvio básico de obstáculos.
- [ ] 4. Implementar movimentação autônoma (`src/agent/AgentController.ts`).
- [ ] 5. Sincronizar agente e cena 3D.
- [ ] 6. Executar bateria de testes automatizados.
- [ ] 7. Corrigir eventuais problemas.
- [ ] 8. Documentar a entrega final do Sprint 1.

