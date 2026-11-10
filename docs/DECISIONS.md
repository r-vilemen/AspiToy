# Registro de Decisões Técnicas e de Design (ADRs) — AspiToy

## ADR-001: Stack React 19 + R3F v9 + Tailwind CSS v4 + Zustand v5
- **Contexto**: O `MASTER_PROMPT.md` define React 19, Vite, TypeScript, Tailwind CSS, Zustand e React Three Fiber.
- **Decisão**: Adotar `@react-three/fiber` v9.8+ e `@react-three/drei` v10.7+, que possuem suporte nativo ao React 19, junto com `@tailwindcss/vite` v4.3 e `zustand` v5.1.
- **Consequência**: Zero conflitos de `peerDependencies` e suporte às APIs modernas do React 19 e Three.js `0.187+`.

## ADR-002: Separação entre Estado Reativo (HUD) e Bridge Mutável de Movimento (60 FPS)
- **Contexto**: Atualizar a posição `(x, z)` e rotação no Zustand a cada frame (60 Hz) causaria 60 re-renderizações por segundo nos componentes React, violando a regra crítica `perf-never-set-state-in-useframe` da skill `r3f-best-practices`.
- **Decisão**: Manter um objeto mutável compartilhado (`robotMotionBridge`) para leitura/escrita frame a frame entre o `AgentController`, `Robot` e `FollowCamera`, sincronizando os valores arredondados no `robotStore` apenas quando necessário para exibição na UI.
- **Consequência**: Animação 3D fluida em 60 FPS e interface React leve.

## ADR-003: Direção de Arte "Sunlit Toy Workshop" (Paleta Quente e HUD Tátil)
- **Contexto**: Evitar aparência de dashboard administrativo escuro/neon ou template SaaS genérico (conforme `MASTER_PROMPT.md` Seção 7.3 e skill `frontend-design`).
- **Decisão**:
  - Cenário banhado por luz solar matinal quente (`#EFE7DA` / `#FFF5E4`), piso amadeirado aconchegante e acentos em coral brinquedo (`#E05A36`) e ciano óptico (`#14B8A6`).
  - HUD flutuante translúcido em creme quente (`rgba(251, 247, 240, 0.88)`) posicionado nas extremidades, deixando mais de 75% da área visível livre para o mundo 3D em telas desktop.
  - Tipografia combinando `Fraunces` (personalidade editorial/animação), `Plus Jakarta Sans` (interface) e `JetBrains Mono` (`tabular-nums` para telemetria).

