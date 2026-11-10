# Especificação de Produto — AspiToy

## 1. Visão do Produto

O **AspiToy** é uma experiência web interativa em 3D onde o usuário acompanha e interage com um pequeno aspirador robótico autônomo e carismático trabalhando dentro de uma sala de estar cinematográfica.

A experiência prioriza a sensação de acompanhar um personagem vivo de animação 3D em vez de um painel administrativo tradicional.

## 2. Direção de Arte e Identidade Visual

- **Estilo**: Animação 3D cinematográfica aconchegante, com iluminação natural entrando pela janela, sombras suaves e materiais táteis estilizados.
- **Paleta de Cores (Token System)**:
  - **Superfície / Luz Solar (`#EFE7DA`)**: Gesso quente iluminado pelo sol da manhã.
  - **Madeira Natural (`#B87D4B` / `#8C5830`)**: Piso de carvalho quente e mobiliário.
  - **Painel Tátil (`#FBF7F0`)**: Creme translúcido que flutua sobre a cena sem obstruir o mundo 3D.
  - **Texto Principal (`#2A211B`)**: Nogueira escuro de alto contraste.
  - **Destaque do Personagem (`#E05A36`)**: Coral/Terracota brinquedo no acabamento do AspiToy e ações primárias.
  - **Indicadores Tecnológicos (`#14B8A6` e `#10B981`)**: Ciano para sensores ópticos/olhos digitais e esmeralda para status operacional.
- **Tipografia**:
  - **Títulos e Identidade**: `Fraunces` (serifa expressiva de toque editorial/animação).
  - **Interface e Controles**: `Plus Jakarta Sans` (legibilidade limpa em português brasileiro).
  - **Telemetria e Coordenadas**: `JetBrains Mono` com `tabular-nums`.

## 3. Personagem Robótico (AspiToy)

- Corpo circular chanfrado com acabamento acetinado marfim (`#F7F3EB`), detalhes em coral (`#E05A36`) e para-choque frontal articulado.
- Visor frontal curvo com **olhos digitais expressivos** que reagem ao estado atual (`IDLE`, `EXPLORING`, `CLEANING`, `AVOIDING`, `RETURNING`, `RECHARGING`, `PAUSED`, `COMPLETED`).
- Animação contínua suave (oscilação sutil de locomoção, aceleração/desaceleração com amortecimento e anel luminoso de status).

## 4. Interação e Comandos

- **Iniciar limpeza**: Inicia a operação autônoma a partir do estado atual.
- **Pausar / Retomar**: Congela ou retoma imediatamente a tarefa atual preservando o contexto.
- **Retornar à base**: Interrompe a tarefa em andamento e orienta o robô de volta à estação de recarga.
- **Seleção de Região**: Permite priorizar sub-regiões da sala de estar (ex.: Tapete Central, Área do Sofá, Entrada, Sala Completa).

