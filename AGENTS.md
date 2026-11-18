# AGENTS.md — Diretrizes para Agentes de Código no Projeto AspiToy

Este documento consolida as regras operacionais, padrões técnicos e Agent Skills que devem ser seguidos durante todo o ciclo de desenvolvimento do **AspiToy**.

## 1. Agent Skills Obrigatórias

Antes de implementar ou refatorar qualquer módulo, consulte as respectivas skills em `.agents/skills/`:

- **`frontend-design`**: Direção estética intencional, paleta quente e artesanal, tipografia expressiva e rejeição de padrões genéricos de dashboard SaaS.
- **`r3f-best-practices`**: Proibição absoluta de `setState` dentro de `useFrame`, uso de seletores granulares no Zustand, mutação direta de refs para animações contínuas, uso de `delta` time e `Suspense`.
- **`three-best-practices`**: Reutilização de geometrias e materiais, controle de luzes ativas (máximo de 3 luzes principais com sombras seletivas), frustum culling, `dpr` limitado a `[1, 2]`.
- **`vercel-react-best-practices`**: Prevenção de re-renderizações desnecessárias, componentes enxutos, importações diretas.
- **`web-design-guidelines`**: Acessibilidade por teclado, foco visível, contraste adequado, rótulos semânticos e suporte a `tabular-nums` em telemetria.

## 2. Regras de Ouro da Arquitetura

1. **Desacoplamento em 3 Camadas**:
   - `src/components/` (Interface React)
   - `src/agent/` (Agente Inteligente — puro TypeScript, sem dependências de React ou objetos de cena Three.js)
   - `src/world/` (Mundo 3D — React Three Fiber / Three.js)
2. **Performance em 60 FPS**:
   - Nunca dispare re-renderizações do React a cada frame.
   - A posição e rotação instantâneas do robô em `useFrame` devem ser lidas/atualizadas via referência mutável (`robotMotionRef` / `getState()`) e sincronizadas com a UI apenas em mudanças de estado ou intervalos discretos.
3. **Execução Incremental por Tarefa**:
   - Implementar exclusivamente a etapa atual prevista em `docs/PROGRESS.md`.
   - Sempre validar com `npm test`, `npm run build` e inspeção visual no navegador antes de concluir.

## 3. Diretriz de Design: Proibição Estrita de Ícones de Estrela/Brilho (Sparkles/Stars)

- **Proibição Absoluta**: É terminantemente proibido utilizar ícones de estrela, brilho ou sparkles (ex: `Sparkles`, `Sparkle`, `Star`, `Stars` da biblioteca `lucide-react` ou SVGs semelhantes) em qualquer parte do sistema (botões, badges, modais, cards ou cabeçalhos).
- **Substituição Semântica**: Em locais onde seja necessário um ícone representativo, utilize símbolos tangíveis e coerentes com a ação (ex: `Paintbrush` para equipar pinturas/skins, `Boxes` para regiões/itens, `Check` para confirmações).


