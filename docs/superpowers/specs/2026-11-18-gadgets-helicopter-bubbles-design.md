# Design Doc: Gadgets Mirabolantes — Modo Aspi-Helicóptero & Canhão de Bolhas Anti-Gravitacionais

**Data:** 18 de Novembro de 2026  
**Status:** Proposto para Aprovação  
**Tamanho:** Projeto (Multi-módulo)  

---

## 1. Visão Geral e Intenção

O **AspiToy** é uma experiência cinematográfica 3D inspirada nos clássicos de animação como *Toy Story* e *Wall-E*. Para elevar a imersão, o dinamismo e o fator "brinquedo vivo", implementaremos dois gadgets mirabolantes:

1. **Modo Aspi-Helicóptero (Limpeza Aérea de Mesas e Sofás)**: O robô estende uma hélice retrátil no topo da sua cúpula, decola no ar (eixo $Y$), ganha inclinação orgânica de voo (*pitch/roll*) e patrulha superfícies elevadas (mesas de centro, mesas de jantar, balcões e sofás) para aspirar sujeiras inacessíveis a aspiradores terrestres normais.
2. **Canhão de Bolhas de Sabão Anti-Gravitacionais**: Diante de sujeiras ou sob comando, o robô dispara esferas iridescentes de sabão anti-gravitacionais que flutuam pelo ar, encapsulam partículas de poeira e estouram em confetes de brilho cintilante.

Ambos os gadgets terão controles diretos no HUD (`ControlPanel`), acionamento por linguagem natural no chat (`CommandInput`), áudio procedural no `soundManager` e integração no ciclo de estados da simulação.

---

## 2. Metas, Não-Metas e Anti-Metas

### Metas (Goals)
- **Hélice Retrátil 3D e Animação de Voo**:
  - Hélice no topo do `RobotModel` com mastro retrátil e pás duplas rotativas com efeito de blur em alta rotação.
  - Voo 3D suave com decolagem vertical, transição de altitude ($Y \approx 0.55\text{m} \sim 0.85\text{m}$), inclinação orgânica de drone (*bank/pitch/roll*) e pouso amortecido.
  - Rota de patrulha aérea cobrindo mesas e sofás da casa.
  - Efeito visual de *downwash* (anel de vento/poeira no chão gerado pelas pás).
- **Canhão de Bolhas Anti-Gravitacionais**:
  - Sistema de partículas 3D (`RobotEffects`) renderizando bolhas iridescentes com material físico translúcido (`MeshPhysicalMaterial` com iridescência/transmissão ou shader leve).
  - Comportamento flutuante suave (ondulação senoidal) que estoura em micro-partículas estelares ao atingir o ápice ou tocar o robô.
- **Controle no HUD & Comandos**:
  - Botões táteis no `ControlPanel`: `"🚁 Helicóptero"` (alterna voo/pouso) e `"🫧 Bolhas"` (rajada de bolhas).
  - Suporte no `CommandInput` para frases como: *"voar"*, *"modo helicóptero"*, *"limpar mesa"*, *"limpar sofá"*, *"disparar bolhas"*, *"pousar"*.
- **Áudio Procedural Dedicado (`soundManager.ts`)**:
  - Som de acionamento de rotor e zumbido contínuo de hélice (osciladores sintetizados via Web Audio API).
  - Som de *pop* cristalino de bolhas com cauda de sino.
- **Performance a 60 FPS**:
  - Manter a regra de ouro `perf-never-set-state-in-useframe`: altitude $Y$, inclinações e rotações são gerenciadas via `robotMotionBridge` mutável.
  - Zero alocações de `Vector3`/`Quaternion` dentro de `useFrame`.

### Não-Metas (Non-Goals)
- Não implementaremos física rígida de colisão aérea complexa contra o teto (o voo ocorre em altura delimitada e segura).
- Não alteraremos a grade 2D terrestre básica do A* para 3D volumétrico complexo (o A* de chão continua sendo a base de navegação e o voo utiliza interpolações curvas de waypoint entre mobílias).

### Anti-Metas (Anti-Goals)
- Evitar que o voo pareça um glitch ou teleporte brusco: a decolagem, a sustentação no ar e o pouso devem ter curvas de aceleração/desaceleração suaves (*smoothstep/damp*) estilo animação Pixar.
- Evitar queda de FPS decorrente de centenas de geometrias pesadas para as bolhas: limitar a quantidade de bolhas ativas simultâneas (máximo 12 a 16) com instancing ou pool de meshes reutilizáveis.

---

## 3. Análise de Abordagens Consideradas

1. **Abordagem 1: Gadgets no HUD + IA Contextual Autônoma *(Escolhida)***:
   - Permite acionar imediatamente via botões no `ControlPanel` ou por comandos de texto no `CommandInput`, além de decisão autônoma ao mirar móveis elevados.
   - *Por que foi escolhida:* É a mais divertida e acessível, permitindo testar e apreciar as animações instantaneamente.
2. **Abordagem 2: Missão Roteirizada Isolada**:
   - Cria um mini-game onde o robô só voa durante uma missão fechada.
   - *Descartada:* Limita a liberdade do usuário de brincar com o helicóptero a qualquer momento no mapa.
3. **Abordagem 3: Ativação Apenas por Comandos de Texto**:
   - Sem botões no HUD, dependendo exclusivamente de digitação.
   - *Descartada:* Esconde as novas mecânicas e reduz a usabilidade tátil.

---

## 4. Arquitetura e Detalhamento Técnico

### 4.1. Camada de Estado e Contratos (`src/types/robot.ts` & `src/store/robotStore.ts`)
- **Novos estados no `RobotOperationalState`**:
  - `'FLYING'` (quando em navegação aérea / modo helicóptero).
- **Extensão do `UserCommandType` (`src/types/commands.ts`)**:
  - `'TOGGLE_HELICOPTER'` e `'FIRE_BUBBLES'` para registro no `ActivityLog` e `commandStore`.
- **Extensão do `RobotMotionBridge`**:
  ```typescript
  export interface RobotMotionBridge {
    x: number;
    z: number;
    y: number;                   // Altitude vertical (0 = chão, > 0 = voo)
    targetY: number;             // Alvo de altitude (0.65m para voo padrão)
    rotationY: number;
    targetRotationY: number;
    pitch: number;               // Inclinação frontal durante voo (-0.2 a +0.2 rad)
    roll: number;                // Inclinação lateral em curvas aéreas (-0.15 a +0.15 rad)
    propellerSpeed: number;      // Velocidade de rotação da hélice (rad/s)
    propellerExtension: number;  // 0 = recolhida, 1 = estendida
    currentSpeed: number;
    isFlying: boolean;
    bubbleBurstTrigger: number;  // Contador discreto para disparar bolhas sem re-render no React
  }
  ```
- **Ações na Store (`useRobotStore`)**:
  - `toggleHelicopterMode: () => void`: Alterna entre decolagem/voo e pouso controlado.
  - `fireBubbleCannon: () => void`: Incrementa `bubbleBurstTrigger` na bridge e registra comando.
- **Protocolo de Bateria Crítica**:
  - Se a bateria cair para $\le 18\%$ durante o voo, o robô cancela imediatamente o modo aéreo, realiza descida vertical controlada até o chão ($Y \to 0$), recolhe a hélice e engaja o estado padrão `'RETURNING'` via A* até a base.

### 4.2. Superfícies Elevadas e Navegação Aérea (`src/world/House/HouseObstacles.ts` / `Furniture.tsx`)
Ao ativar o modo helicóptero, o robô decola e engaja o circuito aéreo de limpeza das superfícies elevadas da residência:
1. **Mesa de Centro da Sala**: $X = 10.5, Z = -0.5, Y = 0.58$
2. **Sofá Principal da Sala**: $X = 10.5, Z = -2.5, Y = 0.68$
3. **Mesa de Apoio / Quarto**: $X = -3.5, Z = 2.0, Y = 0.62$

O voo calcula caminhos diretos spline/lineares sem colisão de piso, permitindo cruzar móveis e descer suavemente sobre cada superfície para aspirar poeira local.

### 4.3. Modelo 3D da Hélice Retrátil (`src/world/Robot/RobotModel.tsx`)
- Adição de um grupo `propellerGroupRef` localizado no topo da cúpula do robô:
  - Mastro telescópico cromado cilíndrico que sobe ao decolar (`propellerExtension`).
  - Rotor central com tampa cônica.
  - Duas pás aerodinâmicas com material acinzentado semi-brilhante.
  - Disco translúcido com gradiente de rotação (efeito de "hélice girando tão rápido que fica transparente").

### 4.4. Dinâmica de Voo e Atualização de Frame (`src/world/Robot/Robot.tsx`)
- Em `useFrame`:
  - Se `robotMotionBridge.isFlying` for verdadeiro:
    - O mastro estende e a hélice acelera até RPM máximo.
    - O eixo $Y$ do robô interpola suavemente para `targetY` usando amortecimento `damp`.
    - Ao se movimentar, o robô inclina para frente (*pitch*) proporcionalmente à velocidade e para os lados (*roll*) ao virar.
    - Quando o robô sobrevoa o sofá ou a mesa, efetua sucção e limpa a poeira próxima na projeção correspondente via `cleanDustNearPoint`.
  - Ao desativar o voo, ele desacelera, desce suavemente até o chão ($Y = 0$), a hélice desacelera e se recolhe para dentro da cúpula.

### 4.5. Canhão de Bolhas Anti-Gravitacionais (`src/world/Robot/RobotEffects.tsx`)
- Pool de bolhas (12 a 16 esferas reutilizáveis):
  - Ao detectar incremento em `robotMotionBridge.bubbleBurstTrigger`, ativa uma rajada de 4 a 6 bolhas com posições e vetores de impulso ascendentes.
  - As bolhas usam material PBR iridescente e flutuam suavemente com ruído senoidal.
  - Após 2.0 a 3.0 segundos (ou ao atingir o solo/mobília), a bolha explode:
    - Dispara partículas de confetes brilhantes (`points` com material aditivo dourado/turquesa).
    - Executa `cleanDustNearPoint(bubble.x, bubble.z, 0.8)` com bônus de purificação, limpando a poeira naquela coordenada!

### 4.6. Síntese de Áudio Procedural (`src/services/soundManager.ts`)
- `startPropellerSound()`: Inicia oscilador sintetizado com rampa ascendente de frequência e modulação em baixa frequência (*flutter*) simulando rotação de pás de helicóptero. Mantém nó de ganho ativo ajustado dinamicamente com base em `propellerSpeed`.
- `stopPropellerSound()`: Rampa descendente de frequência e fade out gradual no nó de ganho.
- `playBubbleShoot()`: Som de ejeção suave de ar e tom percussivo aquoso.
- `playBubblePop()`: Tom cristalino agudo (*pop*) com harmônicos estelares simulando estouro de sabão encantado.

### 4.7. Interface HUD e Interação (`src/components/ui/ControlPanel.tsx` & `CommandInput.tsx`)
- Dois novos botões estilizados no `ControlPanel` seguindo o design tátil:
  - Botão **Helicóptero** com ícone de helicóptero e badge ativo quando em voo.
  - Botão **Bolhas** com animação de disparo e efeito sonoro.
- Parser do `CommandInput` estendido para aceitar:
  - `"voar"`, `"decolar"`, `"modo helicoptero"`, `"pousar"`
  - `"limpar mesa"`, `"limpar sofa"`, `"limpar sofá"`
  - `"bolhas"`, `"canhao de bolhas"`, `"soltar bolhas"`

---

## 5. Plano de Testes e Validação
- **Testes Unitários no Vitest**:
  - Testar transições de estado para `'FLYING'` na store.
  - Testar disparo e reset do canhão de bolhas na store.
  - Testar parser de comandos de linguagem natural no `CommandInput`.
  - Testar rotas aéreas e elevação $Y$ na lógica de movimento.
- **Validação de Build e Tipagem**:
  - `npm run build` e verificação de zero erros no TypeScript.
- **Validação Visual e Performance**:
  - Testar a 60 FPS no navegador: rotação suave da hélice, subida/descida do robô e dispersão das bolhas sem quedas de taxa de quadros.
