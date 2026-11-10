# Progresso de Desenvolvimento — AspiToy

## Status Geral por Sprint

- [x] **Planejamento Técnico Inicial (Seção 19)** — Concluído
- [x] **Sprint 1 — Fundação Visual e Interação** — Concluído
- [x] **Sprint 2 — Inteligência e Navegação (A*)** — Concluído
- [x] **Sprint 3 — Limpeza Inteligente e Bateria** — Concluído
- [x] **Sprint 4 — Interação Avançada e Histórico** — Concluído
- [x] **Sprint 5 — Refinamento, Testes e Entrega** — CONCLUÍDO COM SUCESSO

---

## 1. Resumo Consolidado das Entregas por Sprint

### Sprint 1 — Fundação Visual e Interação (100%)
- **Arquitetura e Setup**: React 19, TypeScript 5.8 estrito, Tailwind CSS 4, Zustand 5 e React Three Fiber 9.
- **Bridge 60 FPS**: `robotMotionBridge` desacopla a física contínua do ciclo de renderização do React.
- **Casa 3D Inicial**: Palco inicial, base de recarga, tapete central e telemetria no HUD.

### Sprint 2 — Inteligência e Navegação (100%)
- **`GridMap.ts`**: Grade 2D discreta de ocupação (40x32 células) com margem de segurança contra móveis e paredes.
- **`PathPlanner.ts`**: Algoritmo A* completo em 8 direções com heurística octile e suavização de caminho.
- **Replanejamento Dinâmico**: Detecção de obstruções ToF e recálculo autônomo sem atravessar móveis.

### Sprint 3 — Limpeza Inteligente (100%)
- **`PriorityManager.ts`**: Algoritmo de ponderação baseado em sujeira acumulada, região do usuário e distância.
- **Controle de Bateria e Emergência**: Monitoramento de consumo de energia com retorno automático à base ao atingir <= 18%.
- **Atualização Dinâmica do Piso**: Redução gradual das manchas de poeira e telemetria precisa de porcentagem higienizada.

### Sprint 4 — Interação Avançada (100%)
- **`CommandInput.tsx`**: Parser de instruções por linguagem natural ("limpar tapete", "ir à base", "pausar").
- **`ActivityLog.tsx`**: Histórico contextual de instruções aceitas/rejeitadas com timestamps.
- **Expressões do Personagem**: Reação dinâmica nos olhos digitais e anel LIDAR (alerta, focado, sonolento, curioso).

### Sprint 5 — Refinamento e Entrega (100%)
- **Materiais PBR**: Vidros físicos com transmissão (`MeshPhysicalMaterial`), cerâmica terracota, madeira em tábuas com ranhuras e latão escovado.
- **Iluminação Cinematográfica**: Sol matinal dourado com sombras de alta resolução (2048x2048) e contato suave (`ContactShadows`).
- **Garantia de Qualidade**: 60 testes automatizados no Vitest (100% aprovados), tipagem estrita sem erros no `tsc --noEmit` e bundle de produção com code-splitting (`three`, `r3f`, `app`).

### Melhorias Recentes Solicitadas pelo Usuário
- **Transparência Dinâmica de Paredes**: Todas as paredes perimetrais e divisórias da casa possuem oclusão translúcida inteligente voltada para a câmera, impedindo bloqueio de visão no ângulo isométrico.
- **Responsividade Mobile**: Layout otimizado para dispositivos móveis com barra de ação rápida inferior flutuante, drawer expansível e botões de controle tátil D-pad de 44px, preservando integralmente o layout desktop.
- **Remoção de Elementos Decorativos**: Remoção das estrelas e esferas da tela de carregamento inicial, garantindo estética limpa e profissional.
- **Telemetria Realista de Área Higienizada**: Sincronização direta e contínua entre a aspiração real do piso (tufos e manchas) e o painel de telemetria, exibindo porcentagem fiel do cômodo ativo e da residência completa com metragem quadrada real higienizada ($m^2$).
