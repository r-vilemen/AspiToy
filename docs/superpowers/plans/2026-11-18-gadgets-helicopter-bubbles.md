# Modo Aspi-Helicóptero & Canhão de Bolhas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o Modo Aspi-Helicóptero (com hélice retrátil 3D, dinâmica de voo com altitude $Y$, inclinação de drone e limpeza de mesas e sofás) e o Canhão de Bolhas Anti-Gravitacionais (com partículas iridescentes flutuantes, estouro de confetes e purificação de poeira).

**Architecture:** Desacoplamento estrito em 3 camadas (UI React, Agente Inteligente, Mundo 3D Three.js/R3F). A física contínua de voo e a rotação da hélice são transmitidas através da `robotMotionBridge` mutável em 60 FPS sem `setState` no frame loop. O áudio é sintetizado proceduralmente via Web Audio API.

**Tech Stack:** React 19, React Three Fiber 9, Three.js 0.187, Zustand 5, Tailwind CSS 4, Web Audio API, Vitest 3.

**Spec:** [docs/superpowers/specs/2026-11-18-gadgets-helicopter-bubbles-design.md](file:///c:/Projetos/Estudos/Unicap/AspiToy/docs/superpowers/specs/2026-11-18-gadgets-helicopter-bubbles-design.md)

## Global Constraints

- Proibição absoluta de `setState` dentro de `useFrame` (`perf-never-set-state-in-useframe`).
- Zero alocação de objetos `THREE.Vector3` ou `THREE.Quaternion` em tempo de frame.
- Reutilização de geometrias e materiais para o pool de bolhas e hélice.
- Tipagem TypeScript 5.8 estrita sem supressões (`noImplicitAny`, zero erros em `tsc --noEmit`).
- Manter compatibilidade com os 60 testes automatizados já existentes no Vitest.

## Review Focus

- Bateria crítica em voo ($\le 18\%$): o robô deve iniciar descida vertical imediata até o solo ($Y \to 0$), recolher a hélice e só então navegar de volta à base.
- Disparo de bolhas em sequência rápida: o pool de bolhas não deve transbordar nem causar vazamento de memória.
- Alternância rápida do botão de helicóptero no HUD: não deve deixar a hélice congelada no meio do mastro nem teleportar a altitude $Y$.
- Comando de voar enquanto já estiver no ar: deve informar que o robô já está em voo ou realizar aterrissagem conforme a intenção.
- Limpeza em mobílias elevadas: deve projetar corretamente a coordenada para o `cleanDustNearPoint` da sala sem quebrar a grade 2D terrestre.

---

### Task 1: Extensão de Tipos e Estado Global (Store & Bridge)

**Files:**
- Modify: `src/types/robot.ts:1-75`
- Modify: `src/types/commands.ts:1-40`
- Modify: `src/store/robotStore.ts:1-250`
- Modify: `src/store/__tests__/stores.test.ts:1-120`

**Interfaces:**
- Consumes: `RobotOperationalState`, `UserCommandType`, `robotMotionBridge`
- Produces: `isFlying`, `y`, `targetY`, `pitch`, `roll`, `propellerSpeed`, `propellerExtension`, `bubbleBurstTrigger`, `toggleHelicopterMode`, `fireBubbleCannon`

- [ ] **Step 1: Escrever teste de unidade falhando para as novas ações e propriedades da store**
Adicionar testes em `src/store/__tests__/stores.test.ts`:
```typescript
it('deve alternar o modo helicóptero e atualizar isFlying na bridge', () => {
  const { toggleHelicopterMode } = useRobotStore.getState();
  expect(robotMotionBridge.isFlying).toBe(false);
  toggleHelicopterMode();
  expect(robotMotionBridge.isFlying).toBe(true);
  expect(robotMotionBridge.targetY).toBeGreaterThan(0.5);
  toggleHelicopterMode();
  expect(robotMotionBridge.isFlying).toBe(false);
  expect(robotMotionBridge.targetY).toBe(0);
});

it('deve incrementar bubbleBurstTrigger ao disparar o canhão de bolhas', () => {
  const initialTrigger = robotMotionBridge.bubbleBurstTrigger;
  const { fireBubbleCannon } = useRobotStore.getState();
  fireBubbleCannon();
  expect(robotMotionBridge.bubbleBurstTrigger).toBe(initialTrigger + 1);
});
```

- [ ] **Step 2: Executar o teste e verificar a falha**
Run: `npm test -- src/store/__tests__/stores.test.ts`
Expected: FAIL ("toggleHelicopterMode is not a function")

- [ ] **Step 3: Implementar as extensões de tipo e ações na store**
- Em `src/types/robot.ts`: adicionar `'FLYING'` ao `RobotOperationalState` e os novos campos (`y`, `targetY`, `pitch`, `roll`, `propellerSpeed`, `propellerExtension`, `isFlying`, `bubbleBurstTrigger`) ao `RobotMotionBridge`.
- Em `src/types/commands.ts`: adicionar `'TOGGLE_HELICOPTER'` e `'FIRE_BUBBLES'` ao `UserCommandType`.
- Em `src/store/robotStore.ts`: inicializar os novos campos na `robotMotionBridge` e implementar `toggleHelicopterMode()` e `fireBubbleCannon()`.

- [ ] **Step 4: Executar os testes e verificar que passaram**
Run: `npm test -- src/store/__tests__/stores.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
`git add src/types/robot.ts src/types/commands.ts src/store/robotStore.ts src/store/__tests__/stores.test.ts && git commit -m "feat(store): add helicopter and bubble cannon states and actions"`

---

### Task 2: Áudio Procedural para Rotor e Bolhas

**Files:**
- Modify: `src/services/soundManager.ts:1-250`
- Modify: `src/services/__tests__/soundManager.test.ts:1-120`

**Interfaces:**
- Consumes: Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`)
- Produces: `startPropellerSound()`, `updatePropellerSpeed(speed: number)`, `stopPropellerSound()`, `playBubbleShoot()`, `playBubblePop()`

- [ ] **Step 1: Escrever teste de unidade falhando para os novos métodos de áudio**
Em `src/services/__tests__/soundManager.test.ts`:
```typescript
it('deve expor métodos para som de hélice e bolhas sem quebrar quando áudio mutado', () => {
  expect(typeof soundManager.startPropellerSound).toBe('function');
  expect(typeof soundManager.stopPropellerSound).toBe('function');
  expect(typeof soundManager.playBubbleShoot).toBe('function');
  expect(typeof soundManager.playBubblePop).toBe('function');
  
  soundManager.startPropellerSound();
  soundManager.updatePropellerSpeed(25);
  soundManager.stopPropellerSound();
  soundManager.playBubbleShoot();
  soundManager.playBubblePop();
});
```

- [ ] **Step 2: Executar o teste e verificar a falha**
Run: `npm test -- src/services/__tests__/soundManager.test.ts`
Expected: FAIL ("soundManager.startPropellerSound is not a function")

- [ ] **Step 3: Implementar a síntese procedural em `src/services/soundManager.ts`**
- Criar nós dedicados de oscilador e ganho para a hélice com rampa de ataque e modulação de frequência de batimento (*flutter*).
- Implementar sons de disparo de ar e sino agudo de estouro de bolha com decaimento exponencial.

- [ ] **Step 4: Executar os testes e verificar que passaram**
Run: `npm test -- src/services/__tests__/soundManager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
`git add src/services/soundManager.ts src/services/__tests__/soundManager.test.ts && git commit -m "feat(audio): add procedural audio for helicopter rotor and bubbles"`

---

### Task 3: Modelo 3D da Hélice Retrátil no Robô

**Files:**
- Modify: `src/world/Robot/RobotModel.tsx:1-400`

**Interfaces:**
- Consumes: `robotMotionBridge.propellerExtension`, `robotMotionBridge.propellerSpeed`
- Produces: Grupo de hélice animado no topo da carcaça do robô com mastro retrátil, pás e disco de desfoque translúcido de alta rotação.

- [ ] **Step 1: Adicionar estrutura 3D da hélice retrátil no topo do robô**
- Inserir um `group` com `ref={propellerRef}` na cúpula superior ($Y \approx 0.18$).
- Elementos:
  - Mastro telescópico em latão/cromo (`cylinderGeometry [0.012, 0.012, 0.08]`).
  - Hub cônico central (`coneGeometry [0.025, 0.03, 16]`).
  - Pás aerodinâmicas duplas (`boxGeometry [0.28, 0.005, 0.03]`).
  - Disco translúcido com gradiente de rotação visível em altas rotações (`circleGeometry [0.15, 32]`).

- [ ] **Step 2: Conectar animação suave em `useFrame`**
- Em `useFrame`, ler `robotMotionBridge.propellerExtension` e posicionar o mastro no eixo $Y$ (`0` quando recolhido, `0.08` quando estendido).
- Incrementar a rotação das pás (`rotation.y += delta * robotMotionBridge.propellerSpeed`).
- Suavizar a visibilidade/opacidade do disco de desfoque conforme a velocidade da hélice sobe.

- [ ] **Step 3: Validar compilação sem erros no TypeScript**
Run: `npx tsc --noEmit`
Expected: PASS sem erros.

- [ ] **Step 4: Commit**
`git add src/world/Robot/RobotModel.tsx && git commit -m "feat(3d): add 3d retractable helicopter propeller to RobotModel"`

---

### Task 4: Física de Voo, Rota de Mobílias e Limpeza Aérea

**Files:**
- Modify: `src/world/Robot/RobotAnimations.ts:1-120`
- Modify: `src/world/Robot/Robot.tsx:1-750`

**Interfaces:**
- Consumes: `robotMotionBridge`, `cleanDustNearPoint`, alvos das mobílias (Mesa de Centro, Sofá)
- Produces: Interpolação de altitude vertical $Y$, inclinação de drone (*pitch/roll*), patrulha aérea de mobílias elevadas e descida de segurança em bateria crítica.

- [ ] **Step 1: Adicionar waypoints aéreos de mobílias em `Robot.tsx`**
```typescript
const AERIAL_FURNITURE_WAYPOINTS = [
  { x: 10.5, z: -0.5, y: 0.58, label: 'Mesa de Centro' },
  { x: 10.5, z: -2.5, y: 0.68, label: 'Sofá Principal' },
  { x: -3.5, z: 2.0, y: 0.62, label: 'Mesa de Apoio' },
];
```

- [ ] **Step 2: Atualizar a dinâmica de voo em `useFrame`**
- Se `robotMotionBridge.isFlying` for `true`:
  - Acelerar `propellerSpeed` até $\approx 45\text{ rad/s}$ e estender `propellerExtension` para `1.0`.
  - Transicionar `robotMotionBridge.y` suavemente até `targetY` via `damp`.
  - Aplicar inclinação dinâmica `pitch` e `roll` no `robotRef.current.rotation` proporcional à velocidade e giro.
  - Percorrer waypoints aéreos elevando a posição 3D do robô sobre a mesa e o sofá, efetuando limpeza contínua via `cleanDustNearPoint`.
  - Se bateria cair para $\le 18\%$, acionar sequência de pouso automático.
- Se `isFlying` for `false`:
  - Descer suavemente até $Y = 0$, desacelerar hélice para 0 e recolher mastro.

- [ ] **Step 3: Executar testes de regressão do agente e navegação**
Run: `npm test`
Expected: Todos os testes existentes passando sem regressão.

- [ ] **Step 4: Commit**
`git add src/world/Robot/RobotAnimations.ts src/world/Robot/Robot.tsx && git commit -m "feat(flight): implement 3d flight dynamics, tilting and furniture patrol"`

---

### Task 5: Efeito de Bolhas Anti-Gravitacionais e Confetes

**Files:**
- Modify: `src/world/Robot/RobotEffects.tsx:1-250`

**Interfaces:**
- Consumes: `robotMotionBridge.bubbleBurstTrigger`, `cleanDustNearPoint`
- Produces: Pool de 16 bolhas iridescentes flutuantes e sistema de partículas de confetes cintilantes ao estourar.

- [ ] **Step 1: Criar estrutura do pool de bolhas em `RobotEffects.tsx`**
- Estrutura com 16 bolhas pré-alocadas (`active: boolean, x, y, z, vx, vy, vz, life, maxLife`).
- Geometria reutilizada (`sphereGeometry [0.06, 16, 16]`) e material PBR iridescente com transparência (`MeshPhysicalMaterial` com `roughness: 0.1, transmission: 0.85, ior: 1.33`).
- Pool de partículas de confetes (`points` com material aditivo).

- [ ] **Step 2: Conectar trigger e física flutuante em `useFrame`**
- Verificar mudança no `robotMotionBridge.bubbleBurstTrigger`:
  - Ejetar 4 a 6 bolhas na posição atual do robô com impulso ascendente suave.
  - Reproduzir som `soundManager.playBubbleShoot()`.
- Em cada frame:
  - Atualizar posição das bolhas com oscilação senoidal lateral (*wobble*).
  - Quando a bolha expirar (`life >= maxLife`):
    - Reproduzir `soundManager.playBubblePop()`.
    - Disparar estouro de confetes brilhantes.
    - Chamar `cleanDustNearPoint(bubble.x, bubble.z, 0.8)`.

- [ ] **Step 3: Validar build e performance sem memory leak**
Run: `npm test` e `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**
`git add src/world/Robot/RobotEffects.tsx && git commit -m "feat(fx): add iridescent anti-gravity bubble cannon with confetti burst"`

---

### Task 6: Controles no HUD & Parser de Comandos de Linguagem Natural

**Files:**
- Modify: `src/components/ui/ControlPanel.tsx:1-200`
- Modify: `src/components/ui/CommandInput.tsx:1-180`
- Modify: `src/components/__tests__/Dashboard.test.tsx:1-100`

**Interfaces:**
- Consumes: `useRobotStore.toggleHelicopterMode`, `useRobotStore.fireBubbleCannon`, `useCommandStore`
- Produces: Botões táteis no HUD com estados ativos e reconhecimento de linguagem natural.

- [ ] **Step 1: Escrever teste de unidade falhando para o reconhecimento de comandos**
Em `src/components/__tests__/Dashboard.test.tsx`:
```typescript
it('deve exibir botões de helicóptero e bolhas no painel de controle', () => {
  render(<ControlPanel />);
  expect(screen.getByRole('button', { name: /helicóptero/i })).toBeDefined();
  expect(screen.getByRole('button', { name: /bolhas/i })).toBeDefined();
});
```

- [ ] **Step 2: Executar o teste e verificar a falha**
Run: `npm test -- src/components/__tests__/Dashboard.test.tsx`
Expected: FAIL ("Unable to find an accessible element with the role 'button' and name /helicóptero/i")

- [ ] **Step 3: Implementar botões no `ControlPanel.tsx` e comandos no `CommandInput.tsx`**
- No `ControlPanel.tsx`:
  - Adicionar botão com ícone de helicóptero, rótulo `"Helicóptero"` e estilo ativo quando `isFlying` for verdadeiro.
  - Adicionar botão com ícone de bolhas e rótulo `"Bolhas"`.
- No `CommandInput.tsx`:
  - Adicionar mapeamento de regex para comandos:
    - `"voar" | "decolar" | "modo helicoptero" | "pousar" -> TOGGLE_HELICOPTER`
    - `"bolhas" | "canhao de bolhas" | "soltar bolhas" -> FIRE_BUBBLES`
    - `"limpar mesa" | "limpar sofa" -> direcionar voo e sucção para a mobília`.

- [ ] **Step 4: Executar os testes e verificar aprovação**
Run: `npm test -- src/components/__tests__/Dashboard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**
`git add src/components/ui/ControlPanel.tsx src/components/ui/CommandInput.tsx src/components/__tests__/Dashboard.test.tsx && git commit -m "feat(ui): add helicopter and bubbles buttons and voice commands to HUD"`

---

### Task 7: Validação Final End-to-End e Build de Produção

**Files:**
- Verificação: todos os arquivos alterados
- Test: Suíte completa Vitest (`npm test`)
- Build: `npm run build`

- [ ] **Step 1: Executar a suíte de testes completa do Vitest**
Run: `npm test`
Expected: 100% dos testes aprovados com 0 falhas.

- [ ] **Step 2: Executar o build estrito de produção**
Run: `npm run build`
Expected: Build concluído com sucesso sem alertas ou erros de tipagem.

- [ ] **Step 3: Commit final e atualização da documentação**
Atualizar `docs/PROGRESS.md` com as novas capacidades entregues.
`git add docs/PROGRESS.md && git commit -m "docs: update progress with helicopter mode and bubble cannon features"`
