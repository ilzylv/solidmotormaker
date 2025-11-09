# Setup do Solid Motor Maker no Windows

## Pré-requisitos

Certifique-se de ter instalado:
- **Node.js** (versão 18+) - Download em https://nodejs.org/
- **Git** (opcional, mas recomendado) - Download em https://git-scm.com/

Verifique as versões:
```bash
node --version
npm --version
```

## Instalação

### Opção 1: Usando NPM (Recomendado para Windows)

1. Extraia o arquivo `solid-motor-maker.zip`
2. Abra o PowerShell ou CMD na pasta do projeto
3. Execute:

```bash
npm install
```

Isso pode levar alguns minutos. Após a conclusão, execute:

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

### Opção 2: Usando PNPM (Se preferir)

Se quiser usar pnpm, instale globalmente primeiro:

```bash
npm install -g pnpm
```

Depois:

```bash
pnpm install
pnpm dev
```

## Estrutura do Projeto

```
solid-motor-maker/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # 4 páginas principais
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── index.css      # Estilos globais
│   └── public/            # Assets estáticos
├── package.json           # Dependências
├── vite.config.ts         # Configuração Vite
└── tsconfig.json          # Configuração TypeScript
```

## Páginas Disponíveis

1. **Predição de Requisitos** - Calcula requisitos de motor a partir de apogeu ou empuxo
2. **Dimensionamento de Grãos** - Projeta grãos propelentes (BATES, cilíndrico, estrela, finocyl)
3. **Dimensionamento Estrutural** - Calcula tensões e visualiza o motor
4. **Simulações Aerodinâmicas** - Analisa estabilidade e apogeu

## Troubleshooting

### Erro: "npm: O termo 'npm' não é reconhecido"

- Reinstale Node.js do site oficial
- Reinicie o PowerShell/CMD após a instalação

### Erro: "Port 5173 already in use"

Use uma porta diferente:
```bash
npm run dev -- --port 3000
```

### Erro: "Cannot find module"

Limpe o cache e reinstale:
```bash
rmdir node_modules /s /q
npm install
```

## Desenvolvimento

Para editar o projeto no WebStorm:

1. Abra a pasta do projeto
2. WebStorm detectará automaticamente que é um projeto Node.js
3. Configure o script de execução:
   - Run → Edit Configurations
   - Adicione: `npm run dev`

## Build para Produção

```bash
npm run build
```

Os arquivos compilados estarão em `dist/`

## Suporte

Se encontrar problemas, verifique:
- Versão do Node.js (deve ser 18+)
- Se a pasta `node_modules` foi criada
- Se há espaço em disco suficiente
- Se o antivírus não está bloqueando a instalação
