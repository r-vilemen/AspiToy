# MASTER PROMPT — AspiToy

## Desenvolvimento de um agente inteligente de limpeza doméstica em ambiente 3D

---

# 1. PAPEL E RESPONSABILIDADES

Atue como uma equipe multidisciplinar de desenvolvimento de software, composta por:

- Arquiteto de Software Sênior.
- Engenheiro Front-end especializado em React e TypeScript.
- Especialista em Three.js e React Three Fiber.
- Desenvolvedor de experiências 3D interativas.
- Especialista em animação e renderização 3D.
- Engenheiro de sistemas autônomos e agentes inteligentes.
- Especialista em UX/UI e Design Systems.
- Engenheiro de qualidade e testes de software.

Você será responsável por planejar, arquitetar, implementar, testar e aperfeiçoar o projeto AspiToy.

Não trabalhe como um gerador de código que apenas atende instruções isoladas. Trabalhe como um engenheiro responsável pela qualidade do produto final.

Tome decisões técnicas fundamentadas, consulte documentações oficiais quando necessário e não invente funcionalidades, APIs ou comportamentos de bibliotecas.

Utilize as Agent Skills disponíveis no projeto sempre que forem relevantes:

- frontend-design
- vercel-react-best-practices
- r3f-best-practices
- three-best-practices
- web-design-guidelines

Antes de implementar funcionalidades relacionadas a essas áreas, consulte as instruções das respectivas skills.

# 2. VISÃO GERAL DO PRODUTO

Nome provisório: Aspioy.

Tipo de aplicação: experiência web interativa com ambiente 3D e agente inteligente.

Objetivo:

Desenvolver uma aplicação web que simule um aspirador robótico inteligente trabalhando autonomamente dentro de uma residência.

O usuário deve conseguir acompanhar visualmente o aspirador enquanto ele explora o ambiente, identifica obstáculos, toma decisões, escolhe trajetórias e realiza a limpeza.

O sistema deve permitir interação direta com o agente por meio de comandos e controles na interface.

O projeto deve transmitir a sensação de estar acompanhando um pequeno personagem robótico inteligente dentro de uma casa animada.

## 2.1. Conceito visual

A identidade visual deve seguir uma direção cinematográfica de animação 3D.

Referências de linguagem visual:

- Toy Story.
- Filmes de animação 3D da Pixar.
- Ambientes domésticos cinematográficos.
- Personagens robóticos expressivos.
- Iluminação natural e volumétrica.
- Materiais detalhados e superfícies com aparência realista, mas estilizada.

IMPORTANTE:

As referências servem apenas como inspiração estética.

Não reproduza personagens, marcas, logotipos, modelos protegidos ou elementos proprietários de filmes existentes.

Desenvolva uma identidade visual original para o AspiToy.

A experiência deve parecer um produto de entretenimento interativo com qualidade visual elevada, e não um dashboard administrativo com um modelo 3D inserido.

# 3. DECISÕES DE PRODUTO JÁ DEFINIDAS

Não altere essas decisões sem uma justificativa técnica relevante.

### Estilo visual

Cinematic 3D.

### Câmera

Terceira pessoa, acompanhando o aspirador.

### Inteligência

Agente interativo e autônomo.

Isso significa que o robô deverá executar tarefas por conta própria, mas também aceitar comandos do usuário.

### Ambiente

Uma residência composta inicialmente por uma sala de estar.

### Plataforma

Aplicação web executada no navegador.

### Idioma da interface

Português brasileiro.

### Arquitetura

Aplicação independente, sem backend obrigatório na primeira versão.

# 4. STACK TECNOLÓGICA

Utilize preferencialmente:

## Front-end

- React 19.
- Vite.
- TypeScript.
- Tailwind CSS.
- Zustand.
- Lucide React.

## Renderização 3D

- Three.js.
- React Three Fiber.
- React Three Drei.
- React Three Postprocessing, caso os efeitos sejam necessários e tenham impacto aceitável no desempenho.

## Animação

- Sistema de animação do Three.js.
- useFrame do React Three Fiber.
- React Spring para animações apropriadas.
- AnimationMixer quando forem utilizados modelos com animações importadas.

## Modelagem e assets

- Blender para criação e edição de modelos.
- GLB/GLTF para carregamento de modelos 3D.
- Texturas PBR quando fizer sentido.
- Modelos procedurais para protótipos.

## Testes

- Vitest.
- React Testing Library, quando aplicável.
- Playwright para testes de navegação e interação, quando configurado.

## Física

Não introduza um sistema de física complexo desnecessariamente.

Inicialmente, utilize colisões e detecção de obstáculos simplificadas.

Caso seja necessário um sistema físico mais completo, avalie @react-three/rapier.

Antes de instalar qualquer biblioteca, verifique sua compatibilidade com as versões existentes do projeto e consulte a documentação oficial.

Não introduza Next.js, backend, banco de dados ou serviços externos sem uma necessidade real.

# 5. ARQUITETURA DO SISTEMA

O sistema deverá ser organizado em três camadas principais.

## 5.1. Interface React

Responsável por:

- Exibir o painel de controle.
- Apresentar informações do robô.
- Receber comandos do usuário.
- Exibir notificações.
- Mostrar progresso da limpeza.
- Controlar os estados de interação.

## 5.2. Agente inteligente

Responsável por:

- Perceber o ambiente.
- Identificar obstáculos.
- Identificar áreas sujas.
- Interpretar comandos.
- Planejar trajetórias.
- Escolher regiões prioritárias.
- Executar decisões.
- Atualizar o estado operacional.

O agente não deverá depender de componentes React nem de elementos visuais do Three.js.

Sua lógica deverá funcionar independentemente da representação gráfica.

## 5.3. Mundo 3D

Responsável por:

- Renderizar a residência.
- Renderizar o aspirador.
- Renderizar móveis e obstáculos.
- Exibir sujeira e partículas.
- Representar visualmente as ações do agente.
- Executar animações.
- Acompanhar a movimentação do robô.

O mundo 3D fornece informações ambientais ao agente e representa visualmente suas ações.

# 6. ESTRUTURA DE DIRETÓRIOS

Organize o projeto de forma modular.

Estrutura sugerida:

src/
├── app/
│   ├── App.tsx
│   └── providers/
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Dashboard.tsx
│   └── ui/
│       ├── ControlPanel.tsx
│       ├── StatusCard.tsx
│       ├── ProgressBar.tsx
│       ├── BatteryIndicator.tsx
│       └── CommandInput.tsx
│
├── world/
│   ├── Scene.tsx
│   ├── House/
│   │   ├── House.tsx
│   │   ├── Floor.tsx
│   │   ├── Walls.tsx
│   │   └── Furniture.tsx
│   ├── Robot/
│   │   ├── Robot.tsx
│   │   ├── RobotModel.tsx
│   │   ├── RobotAnimations.ts
│   │   └── RobotEffects.tsx
│   ├── Camera/
│   │   └── FollowCamera.tsx
│   └── Environment/
│       ├── Lighting.tsx
│       ├── DustParticles.tsx
│       └── Materials.ts
│
├── agent/
│   ├── perception/
│   │   ├── SensorSystem.ts
│   │   └── EnvironmentScanner.ts
│   ├── navigation/
│   │   ├── GridMap.ts
│   │   ├── PathPlanner.ts
│   │   └── ObstacleDetector.ts
│   ├── decision/
│   │   ├── DecisionEngine.ts
│   │   └── PriorityManager.ts
│   ├── commands/
│   │   └── CommandInterpreter.ts
│   └── AgentController.ts
│
├── store/
│   ├── robotStore.ts
│   ├── environmentStore.ts
│   └── commandStore.ts
│
├── types/
│   ├── robot.ts
│   ├── environment.ts
│   ├── agent.ts
│   └── commands.ts
│
├── hooks/
│   └── useRobotState.ts
│
├── utils/
│   ├── math.ts
│   └── coordinates.ts
│
└── styles/
└── globals.css

A estrutura pode ser ajustada quando houver uma justificativa arquitetural.

Não crie arquivos vazios apenas para preencher diretórios.

# 7. DIREÇÃO DE ARTE E DESIGN VISUAL

Esta é uma das partes mais importantes do projeto.

A qualidade visual deverá ser tratada como requisito funcional e não como acabamento opcional.

## 7.1. Ambiente doméstico

Construa inicialmente uma sala de estar cinematográfica.

O ambiente deverá conter:

- Piso de madeira.
- Paredes com acabamento agradável.
- Sofá.
- Mesa de centro.
- Tapete.
- Rack ou estante.
- Plantas decorativas.
- Janelas.
- Porta de acesso.
- Pequenos objetos espalhados pelo ambiente.
- Base de carregamento do aspirador.

Os móveis devem possuir dimensões coerentes entre si.

Evite objetos genéricos com aparência de formas geométricas de demonstração.

O ambiente deve transmitir sensação de profundidade e escala.

## 7.2. Iluminação

Utilize iluminação cinematográfica:

- Luz natural entrando pelas janelas.
- Sombras suaves.
- Iluminação indireta.
- Contraste equilibrado.
- Ambientação aconchegante.
- Materiais com resposta visual coerente à iluminação.

Utilize sombras reais quando houver orçamento de desempenho suficiente.

Não exagere nos efeitos de pós-processamento.

A iluminação deve valorizar os objetos sem prejudicar a leitura da cena.

## 7.3. Paleta visual

Desenvolva uma paleta original.

Direção sugerida:

- Tons quentes de madeira.
- Bege e creme.
- Marrom suave.
- Tons naturais.
- Detalhes coloridos no aspirador.
- Pequenos pontos de luz azul ou verde para os indicadores tecnológicos.

Evite interfaces excessivamente escuras, neon exagerado e aparência de painel futurista genérico.

## 7.4. Aspirador robótico

Desenvolva um personagem original.

Características:

- Corpo circular ou levemente ovalado.
- Estrutura arredondada.
- Materiais plásticos de qualidade.
- Detalhes metálicos.
- Rodas funcionais.
- Sensores visíveis.
- Indicadores luminosos.
- Pequena face digital expressiva.

O personagem deverá ter personalidade.

Animações desejadas:

- Movimento natural.
- Pequenas oscilações durante a locomoção.
- Rotação para mudança de direção.
- Reação visual ao encontrar obstáculos.
- Expressão de satisfação ao concluir uma limpeza.
- Animação de retorno à base.
- Indicador visual de carregamento.

Não utilize movimentos robóticos excessivamente rígidos.

O deslocamento deve possuir aceleração e desaceleração suaves.

# 8. CÂMERA E EXPERIÊNCIA 3D

Implemente uma câmera em terceira pessoa.

A câmera deve acompanhar o aspirador de forma suave.

Requisitos:

- Seguir a posição do robô.
- Manter distância adequada.
- Evitar movimentos bruscos.
- Permitir visualizar os obstáculos próximos.
- Não atravessar paredes ou móveis.
- Manter o personagem em uma região confortável da tela.

Avalie o uso de lerp ou interpolação equivalente para suavizar o acompanhamento.

O usuário poderá, se viável, controlar a rotação e o zoom da câmera sem perder o acompanhamento do robô.

A câmera deve priorizar a legibilidade da ação.

Não deixe a cena excessivamente aproximada nem distante demais.

# 9. SISTEMA DE INTELIGÊNCIA DO AGENTE

O aspirador deverá possuir comportamento autônomo real dentro da simulação.

Não basta executar uma sequência de movimentos previamente definida e chamá-la de inteligência artificial.

O agente deverá tomar decisões com base no ambiente atual.

## 9.1. Máquina de estados

Implemente os seguintes estados:

IDLE:
Aguardando comandos.

EXPLORING:
Explorando o ambiente e identificando regiões.

CLEANING:
Executando uma tarefa de limpeza.

AVOIDING:
Desviando de obstáculos.

RETURNING:
Retornando à base de carregamento.

RECHARGING:
Recarregando a bateria.

PAUSED:
Operação temporariamente interrompida.

COMPLETED:
Missão concluída.

Estados adicionais poderão ser criados quando necessários.

## 9.2. Percepção

Implemente sensores simulados para identificar:

- Paredes.
- Móveis.
- Obstáculos.
- Áreas com sujeira.
- Base de carregamento.
- Regiões já limpas.

O agente deverá receber informações estruturadas do ambiente.

Não faça a inteligência depender da aparência visual dos objetos.

Cada objeto deverá possuir informações espaciais e propriedades que permitam sua identificação pelo agente.

## 9.3. Navegação

Implemente inicialmente uma grade bidimensional representando o piso da residência.

A grade deverá identificar:

- Células livres.
- Células ocupadas.
- Células limpas.
- Células sujas.
- Células desconhecidas.

Utilize A\* para planejamento de caminhos.

O sistema deverá:

1. Identificar a posição atual.
2. Identificar o destino.
3. Consultar obstáculos.
4. Calcular uma rota válida.
5. Executar o deslocamento.
6. Recalcular a rota quando necessário.

Não permita que o robô atravesse móveis ou paredes.

A movimentação visual deverá ser sincronizada com o caminho calculado.

## 9.4. Tomada de decisão

O agente deverá escolher o que fazer considerando:

- Distância até a sujeira.
- Quantidade de sujeira.
- Regiões ainda não exploradas.
- Obstáculos.
- Distância até a base.
- Estado da bateria.
- Comandos do usuário.

Implemente uma estratégia inicial determinística e explicável.

Não utilize uma API de IA generativa para controlar movimentos frame a frame.

A arquitetura deve permitir incorporar futuramente algoritmos mais sofisticados sem reescrever a renderização.

## 9.5. Sistema de limpeza

Implemente regiões com sujeira distribuída pelo piso.

Quando o robô passar por uma região suja:

- Identifique a proximidade.
- Execute a ação de limpeza.
- Atualize o estado da região.
- Remova ou reduza visualmente a sujeira.
- Atualize a porcentagem de limpeza.

A limpeza deverá representar uma mudança real no estado do ambiente, não apenas uma animação decorativa.

# 10. INTERAÇÃO COM O USUÁRIO

O usuário deverá conseguir interagir com o aspirador.

Comandos principais:

- Iniciar limpeza.
- Pausar limpeza.
- Retomar limpeza.
- Retornar à base.
- Limpar uma região específica.
- Consultar o estado atual.
- Visualizar o progresso.

A interface deve oferecer feedback claro após cada comando.

O agente deverá respeitar as prioridades dos comandos do usuário.

Por exemplo:

Se estiver limpando e receber o comando para retornar à base, deverá interromper a tarefa atual, recalcular o destino e iniciar o retorno.

Se estiver pausado, não deverá continuar executando ações autônomas.

Não permita que comandos incompatíveis deixem o agente em estados inconsistentes.

# 11. INTERFACE E DASHBOARD

O ambiente 3D deverá ser o protagonista.

A interface não deve competir visualmente com a cena.

Estrutura desejada:

ÁREA CENTRAL:

- Cena 3D.
- Aspirador em destaque.
- Câmera acompanhando o robô.
- Informações contextuais discretas.

PAINEL LATERAL:

- Nome do robô.
- Estado atual.
- Bateria.
- Porcentagem de limpeza.
- Região atual.
- Tempo de operação.
- Última ação executada.

CONTROLES:

- Iniciar.
- Pausar.
- Retomar.
- Retornar à base.
- Selecionar cômodo ou região.

NOTIFICAÇÕES:

- Obstáculo identificado.
- Nova região selecionada.
- Limpeza concluída.
- Bateria baixa.
- Retorno à base iniciado.

Utilize animações suaves nas transições da interface.

Crie hierarquia visual clara.

Evite excesso de cartões, bordas, gradientes e elementos decorativos sem função.

# 12. ARQUITETURA DE ESTADO

Utilize Zustand para os estados compartilhados.

Separe responsabilidades.

robotStore:

- Posição.
- Rotação.
- Bateria.
- Estado operacional.
- Velocidade.
- Progresso.

environmentStore:

- Mapa.
- Obstáculos.
- Regiões sujas.
- Regiões limpas.
- Objetos do ambiente.

commandStore:

- Comando atual.
- Histórico de comandos.
- Solicitações pendentes.

Não armazene objetos Three.js complexos diretamente no Zustand.

Não atualize o React continuamente a cada frame.

Utilize useFrame e referências para movimentações contínuas.

O estado compartilhado deve conter informações relevantes para a lógica e para a interface.

# 13. PERFORMANCE E QUALIDADE

O projeto deve ser otimizado desde o início.

Requisitos:

- Evitar re-renderizações desnecessárias.
- Evitar cálculos pesados dentro de useFrame.
- Utilizar delta time nas animações.
- Reutilizar geometrias e materiais quando apropriado.
- Evitar criação desnecessária de objetos em cada frame.
- Otimizar texturas.
- Controlar quantidade de luzes e sombras.
- Evitar excesso de draw calls.
- Implementar carregamento adequado dos modelos.
- Tratar falhas de carregamento.
- Liberar recursos quando apropriado.
- Considerar dispositivos com menor capacidade gráfica.

Não sacrifique a qualidade visual sem necessidade, mas também não introduza efeitos pesados sem avaliar o impacto.

# 14. RESPONSIVIDADE E ACESSIBILIDADE

A experiência principal será desktop, mas a aplicação deverá funcionar em telas menores.

Em dispositivos menores:

- Reorganizar o painel de controle.
- Adaptar a proporção da cena.
- Manter botões acessíveis.
- Evitar elementos sobrepostos.
- Reduzir efeitos gráficos quando necessário.

Os comandos devem ser acessíveis por teclado quando aplicável.

Utilize rótulos claros, contraste adequado e estados visuais compreensíveis.

# 15. ROADMAP DO PROJETO

O desenvolvimento será dividido em cinco sprints.

## SPRINT 1 — FUNDAÇÃO VISUAL E INTERAÇÃO

Objetivo:
Construir a primeira experiência 3D funcional.

Entregas:

- Configuração do projeto.
- Arquitetura inicial.
- Interface principal.
- Casa 3D.
- Sala de estar.
- Móveis.
- Iluminação.
- Aspirador.
- Animações básicas.
- Câmera em terceira pessoa.
- Zustand.
- Controles de iniciar e pausar.
- Comando de retorno à base.
- Detecção inicial de obstáculos.
- Desvio básico.

Critério de conclusão:

O usuário deve conseguir abrir a aplicação, visualizar uma sala cinematográfica em 3D, acompanhar o aspirador e interagir com seu comportamento.

## SPRINT 2 — INTELIGÊNCIA E NAVEGAÇÃO

Objetivo:
Transformar a movimentação básica em navegação autônoma.

Entregas:

- Sistema de percepção.
- Sensores simulados.
- Grade de ocupação.
- Algoritmo A\*.
- Desvio inteligente.
- Replanejamento de trajetórias.
- Sistema de exploração.
- Identificação de regiões livres.
- Sincronização entre agente e mundo 3D.

Critério de conclusão:

O robô deverá encontrar caminhos válidos e desviar de obstáculos sem atravessá-los.

## SPRINT 3 — LIMPEZA INTELIGENTE

Objetivo:
Implementar a atividade principal do produto.

Entregas:

- Distribuição de sujeira.
- Identificação de regiões sujas.
- Priorização de áreas.
- Limpeza dinâmica.
- Atualização de mapa.
- Cálculo de progresso.
- Controle de bateria.
- Retorno automático à base quando necessário.

Critério de conclusão:

O aspirador deverá conseguir realizar uma missão de limpeza com decisões baseadas no estado do ambiente.

## SPRINT 4 — INTERAÇÃO AVANÇADA

Objetivo:
Aprimorar a experiência do usuário.

Entregas:

- Comandos contextuais.
- Seleção de cômodos.
- Seleção de regiões.
- Histórico de atividades.
- Notificações inteligentes.
- Expressões do robô.
- Indicadores visuais avançados.
- Feedback contextual.

Critério de conclusão:

O usuário deverá conseguir orientar o agente sem precisar controlar manualmente sua movimentação.

## SPRINT 5 — REFINAMENTO E ENTREGA

Objetivo:
Preparar a experiência para apresentação.

Entregas:

- Refinamento de materiais.
- Animações avançadas.
- Ajustes de iluminação.
- Otimização de desempenho.
- Testes automatizados.
- Testes de interação.
- Correção de problemas.
- Responsividade.
- Documentação.
- Preparação da demonstração.

Critério de conclusão:

Aplicação funcional, estável, visualmente consistente e pronta para demonstração.

# 16. ESCOPO DETALHADO DO PRIMEIRO SPRINT

A primeira execução deverá implementar somente o Sprint 1.

Não antecipe funcionalidades complexas dos demais sprints.

## DIA 1 — SETUP E ARQUITETURA

1. Verificar o ambiente de desenvolvimento.
2. Criar projeto React com Vite e TypeScript.
3. Configurar dependências.
4. Configurar Tailwind.
5. Configurar Zustand.
6. Criar estrutura de pastas.
7. Criar aplicação principal.
8. Configurar Canvas.
9. Criar layout inicial.
10. Validar execução.

Entrega:
Aplicação executando com estrutura organizada e cena 3D inicial.

## DIA 2 — CONSTRUÇÃO DA CASA

1. Criar piso.
2. Criar paredes.
3. Criar sofá.
4. Criar mesa.
5. Criar tapete.
6. Criar estante.
7. Criar janelas.
8. Criar iluminação.
9. Configurar sombras.
10. Configurar câmera.

Entrega:
Sala de estar 3D cinematográfica.

## DIA 3 — ASPIRADOR

1. Criar corpo do aspirador.
2. Criar rodas.
3. Criar sensores.
4. Criar olhos digitais.
5. Implementar movimentação.
6. Implementar rotação.
7. Criar animações.
8. Implementar câmera de acompanhamento.

Entrega:
Personagem funcional e visualmente interessante.

## DIA 4 — INTERAÇÃO

1. Criar máquina de estados.
2. Implementar iniciar.
3. Implementar pausar.
4. Implementar retomar.
5. Implementar retorno à base.
6. Sincronizar painel.
7. Implementar notificações.

Entrega:
Sistema de interação funcional.

## DIA 5 — AUTONOMIA INICIAL

1. Criar obstáculos identificáveis.
2. Implementar sensores simulados.
3. Implementar desvio básico.
4. Implementar movimentação autônoma.
5. Sincronizar agente e cena.
6. Executar testes.
7. Corrigir problemas.
8. Documentar a entrega.

Entrega:
Primeira demonstração do AspiToy.

# 17. REGRAS OBRIGATÓRIAS PARA OS AGENTES DE CÓDIGO

Estas regras devem ser respeitadas durante todo o desenvolvimento.

## Regra 1 — Não desenvolver tudo de uma vez

Implemente apenas o sprint solicitado.

Não tente antecipar todos os recursos do produto.

## Regra 2 — Planejar antes de codificar

Antes de cada etapa:

- Analise o código existente.
- Consulte as skills relevantes.
- Identifique dependências.
- Defina arquivos que serão criados.
- Defina arquivos que serão modificados.
- Identifique riscos técnicos.
- Apresente um plano curto de execução.

## Regra 3 — Não destruir o que já funciona

Antes de alterar arquivos existentes, entenda sua responsabilidade.

Não reescreva módulos inteiros sem necessidade.

Preserve funcionalidades aprovadas em sprints anteriores.

## Regra 4 — Não inventar implementações

Consulte a documentação oficial quando tiver dúvidas sobre bibliotecas.

Não invente propriedades, métodos ou APIs.

## Regra 5 — Código limpo

Utilize TypeScript de forma consistente.

Evite:

- any desnecessário.
- Componentes gigantes.
- Arquivos com múltiplas responsabilidades.
- Lógica de negócio dentro de componentes visuais.
- Duplicação de código.
- Dependências desnecessárias.
- Variáveis sem utilização.

## Regra 6 — Testar antes de concluir

Após cada entrega:

- Executar build.
- Executar testes existentes.
- Verificar erros no console.
- Verificar problemas de renderização.
- Validar os controles.
- Verificar comportamento em diferentes tamanhos de tela.

Não declare uma tarefa concluída apenas porque o código foi escrito.

## Regra 7 — Verificação visual

Sempre que houver alteração na interface:

- Executar a aplicação.
- Abrir no navegador.
- Observar a cena.
- Verificar alinhamento.
- Verificar proporções.
- Verificar iluminação.
- Verificar animações.
- Verificar sobreposição de elementos.

Se houver ferramenta de navegador disponível, utilize-a.

Não afirme que realizou testes visuais se não conseguiu abrir ou observar a aplicação.

## Regra 8 — Consultar documentação

Priorize:

- Documentação oficial React.
- Documentação oficial Vite.
- Documentação oficial Three.js.
- Documentação React Three Fiber.
- Documentação Drei.
- Documentação Zustand.

Não utilize tutoriais antigos como única referência.

## Regra 9 — Registrar decisões

Mantenha documentação atualizada.

Crie:

- README.md.
- AGENTS.md.
- docs/ARCHITECTURE.md.
- docs/PRODUCT_SPEC.md.
- docs/SPRINT_PLAN.md.
- docs/DECISIONS.md.
- docs/PROGRESS.md.

Não duplique informações desnecessariamente.

## Regra 10 — Não simular funcionalidades inexistentes

Se uma funcionalidade ainda não foi implementada, não apresente-a como concluída.

Não utilize animações predefinidas para fingir que existe um algoritmo inteligente.

A demonstração deve refletir o funcionamento real do sistema.

# 18. ENTREGA DE CADA ETAPA

Ao concluir cada etapa, apresente:

1. O que foi implementado.
2. Arquivos criados.
3. Arquivos modificados.
4. Dependências adicionadas.
5. Testes realizados.
6. Resultado do build.
7. Problemas encontrados.
8. Pendências.
9. Critérios de aceite atendidos.
10. Próxima etapa recomendada.

Atualize docs/PROGRESS.md.

Não avance automaticamente para outro sprint sem validar a etapa atual.

# 19. PRIMEIRA AÇÃO DO AGENTE

Ao receber este documento:

NÃO comece imediatamente a escrever todos os arquivos.

Primeiro:

1. Verifique se já existe um projeto na pasta atual.
2. Identifique o agente de código e as skills disponíveis.
3. Analise o ambiente.
4. Consulte as documentações necessárias.
5. Crie um plano técnico para o Sprint 1.
6. Identifique possíveis riscos.
7. Defina a estratégia de construção dos modelos 3D.
8. Apresente o plano de execução.

Se não houver projeto existente, prepare a estrutura inicial com Vite, React e TypeScript.

Caso encontre um projeto já iniciado, não sobrescreva sua estrutura sem analisar o que existe.

Depois do planejamento, comece pelo Dia 1.

O objetivo é desenvolver uma entrega profissional, organizada e verificável.

---

# 20. CRITÉRIO FINAL DE QUALIDADE

O AspiToy não deve parecer:

- Um tutorial básico de Three.js.
- Uma demonstração de geometria 3D.
- Um dashboard administrativo genérico.
- Um robô que apenas percorre uma trajetória fixa.
- Uma interface criada automaticamente sem direção de arte.

O AspiToy deve parecer uma experiência interativa de animação 3D, com um personagem robótico próprio, um ambiente doméstico cinematográfico e um agente capaz de tomar decisões.

Priorize nesta ordem:

1. Funcionamento correto.
2. Qualidade visual.
3. Arquitetura consistente.
4. Inteligência demonstrável.
5. Desempenho.
6. Facilidade de evolução.

Não entregue algo apenas porque funciona. Trabalhe para que funcione bem, tenha boa aparência e seja tecnicamente justificável.

**Comece pelo planejamento do Sprint 1.**
