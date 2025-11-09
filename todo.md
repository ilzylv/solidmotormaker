# Solid Motor Maker - TODO

## Estrutura e Navegação
- [x] Criar layout principal com navegação entre 4 páginas
- [x] Implementar roteamento para todas as páginas

## Página 1: Predição de Requisitos de Motor
- [x] Criar interface para input de apogeu desejado
- [x] Criar interface para input de empuxo médio desejado
- [x] Implementar cálculo de requisitos de motor baseado em apogeu
- [x] Implementar cálculo de requisitos de motor baseado em empuxo médio
- [x] Adicionar sistema de alerta para limites teóricos
- [x] Implementar validação quando motor sólido seria muito pesado
- [x] Exibir resultados com parâmetros recomendados do motor

## Página 2: Dimensionamento e Performance dos Grãos
- [x] Criar formulário de inputs do usuário para grãos
- [x] Implementar cálculo de área de queima
- [x] Implementar cálculo de taxa de queima
- [x] Implementar cálculo de produção de massa
- [x] Calcular curva de empuxo vs tempo
- [x] Exibir geometria do grão (BATES, cilíndrico, estrela)
- [x] Mostrar performance esperada do grão

## Página 3: Dimensionamento Estrutural e Visualização
- [x] Criar inputs para dimensionamento de parafusos
- [x] Criar inputs para dimensionamento de bulkhead
- [x] Criar inputs para dimensionamento de tubeira
- [x] Implementar cálculos estruturais (tensões, fator de segurança)
- [x] Criar visualização 2D do layout do motor
- [x] Desenhar componentes com base nas dimensões calculadas
- [x] Adicionar dimensões e anotações no desenho

## Página 4: Simulações Aerodinâmicas
- [x] Criar inputs para parâmetros do foguete
- [x] Implementar simulação de estabilidade (CP vs CG)
- [x] Implementar simulação de apogeu aerodinâmico
- [x] Calcular coeficiente de arrasto
- [x] Implementar predição de aerofólio adequado
- [x] Implementar predição de coifa adequada
- [x] Exibir gráficos de trajetória
- [x] Mostrar margem de estabilidade

## Estilo e Design
- [x] Definir paleta de cores baseada no tema de propulsão
- [x] Implementar design consistente em todas as páginas
- [x] Adicionar ícones e elementos visuais
- [x] Garantir responsividade mobile

## Testes e Validação
- [x] Testar todos os cálculos com casos conhecidos
- [x] Validar limites e alertas
- [x] Testar navegação entre páginas
- [x] Verificar responsividade

## Bugs e Melhorias Solicitadas
- [x] Melhorar layout geral (espaçamento, tipografia, cards)
- [x] Redesenhar visualizador do motor na página 3
- [x] Corrigir bug: resultados não aparecem na página 1

## Novos Bugs Reportados
- [x] Remover validação que bloqueia cálculo na página 1
- [x] Redesenhar diagrama do foguete na página de simulações aerodinâmicas

## Novas Funcionalidades Solicitadas
- [ ] Adicionar seletor de propelentes com fórmulas principais (KNDX, KNSB, KNSU, etc.)
- [ ] Mostrar curva de impulso total (empuxo vs tempo) na página de grãos
- [ ] Corrigir bug: resultados não aparecem na página de predição de requisitos
