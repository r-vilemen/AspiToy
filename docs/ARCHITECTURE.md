# Arquitetura do Sistema — AspiToy

## 1. Visão em Três Camadas

O sistema é estritamente dividido em três camadas desacopladas:

```text
+-------------------------------------------------------------------+
| 1. INTERFACE REACT (src/components/)                              |
|    Header, Dashboard, ControlPanel, StatusCard, Notificações      |
+---------------------------------+---------------------------------+
                                  |
                      Stores Zustand (src/store/)
             (robotStore, environmentStore, commandStore)
                                  |
        +-------------------------+-------------------------+
        |                                                   |
        v                                                   v
+-------+-----------------------------------+   +-----------+-----------------------------------+
| 2. AGENTE INTELIGENTE (src/agent/)        |   | 3. MUNDO 3D (src/world/)                      |
|    Puro TypeScript (sem React/Three.js)   |   |    React Three Fiber + Three.js + Drei        |
|    Percepção, Navegação, Decisão, FSM     |   |    Scene, House, Robot, Camera, Environment   |
+-------------------------------------------+   +-----------------------------------------------+
```

### 1.1. Interface React (`src/components/`)
- Exibe telemetria essencial (estado operacional, bateria, progresso, região atual, tempo de operação e última ação).
- Envia comandos ao `commandStore` e `robotStore` com validação de transição de estados.
- Utiliza seletores granulares (`useRobotStore(s => s.status)`) para evitar re-renderizações desnecessárias.

### 1.2. Agente Inteligente (`src/agent/`)
- Independente da camada visual: opera sobre coordenadas 2D `(x, z)`, metadados espaciais de obstáculos e grade de ocupação.
- Máquina de estados finita (FSM) com os estados: `IDLE`, `EXPLORING`, `CLEANING`, `AVOIDING`, `RETURNING`, `RECHARGING`, `PAUSED` e `COMPLETED`.

### 1.3. Mundo 3D (`src/world/`)
- Renderiza a sala de estar, móveis, iluminação cinematográfica, estação de recarga e o personagem AspiToy.
- Lê e atualiza transformações contínuas em `useFrame` através de referências mutáveis (`robotPoseRef`), garantindo 60 FPS sem chamar `setState` por frame.

## 2. Arquitetura de Estado e Performance

- **`robotStore`**: Armazena estado operacional, bateria, velocidade configurada, progresso, região atual e pose discreta para o HUD, além de expor um objeto mutável `robotMotionBridge` para leitura/escrita em `useFrame` sem custo de re-renderização React.
- **`environmentStore`**: Armazena dimensões da sala, zonas nomeadas, obstáculos com bounding boxes 2D `(minX, maxX, minZ, maxZ)`, posição da base de carregamento e pontos de sujeira.
- **`commandStore`**: Gerencia o comando ativo, fila/histórico de comandos e notificações contextuais da interface.

## 3. Estratégia de Construção dos Modelos 3D

Para garantir fidelidade estética imediata, carregamento instantâneo sem dependência de arquivos externos quebrados e controle total de materiais PBR estilizados:
- A sala de estar e o personagem **AspiToy** são construídos com **modelagem procedural composta de alta precisão** (grupos hierárquicos com geometrias chanfradas/arredondadas `RoundedBox`, cilindros, cápsulas e materiais PBR compartilhados em `Materials.ts`), suportando também carregamento de `.glb` via `Suspense` quando necessário.
- Geometrias e materiais estáticos são instanciados e reutilizados no módulo `Materials.ts` para reduzir draw calls e consumo de memória GPU.

