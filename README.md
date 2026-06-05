# 🏐 Titans Vôlei — Sistema de Gestão

Aplicação web completa para gerenciamento do grupo de vôlei **Titans**, com controle de mensalistas, presenças, pagamentos, comprovantes e highlights de jogadas.

---

## ✨ Funcionalidades

### 🏠 Home
Painel inicial com resumo rápido: próxima sessão, status de mensalistas e informações gerais do grupo.

### 📅 Calendário
Visualização mensal das sessões de sexta-feira. Indica feriados, sessões canceladas e permite navegar entre meses.

### 👥 Mensalistas
Gerenciamento completo dos jogadores mensalistas:
- Lista por mês/ano com navegação entre períodos
- Marcação de **pago / pendente** por jogador
- **Anexar comprovante de pagamento** (imagem ou PDF) diretamente na lista — ao clicar no ícone de clipe, abre um dialog com nome e mês/ano pré-preenchidos
- Ícone verde de recibo quando comprovante está anexado (abre o arquivo em nova aba)
- Cards de resumo: Total de jogadores, Pagos, Pendentes, Arrecadado, Avulsos do mês e Caixa Avulso
- Informações de pagamento (chave PIX, banco, titular, valor por pessoa)

### 📋 Lista de Presenças
Controle de presença por sessão (data):
- Adicionar jogadores como **Mensalista** ou **Avulso**
- Avulsos podem ser marcados como **SUB** (substituto de mensalista) — SUBs não entram na cobrança
- Toggle de **pago/pendente** exclusivo para avulsos não-SUB
- **Anexar comprovante** para avulsos pagos (dialog com nome e mês/ano)
- Resumo financeiro da sessão: mensalistas + avulsos pagos + total arrecadado
- Indicação de feriado e sessão cancelada

### 💳 Comprovantes
Central de comprovantes de pagamento:
- **Aba Mensalista**: comprovantes enviados via Mensalistas ou Presença aparecem automaticamente aqui
- **Aba Quadra**: comprovantes de aluguel da quadra
- Filtro por período (mês/ano)
- Visualização (imagem inline ou link para PDF)
- Exclusão sincronizada — ao excluir aqui, o ícone de comprovante some automaticamente em Mensalistas/Presença
- Upload manual de novos comprovantes com seleção de tipo, jogador, mês e ano

### 🎬 Highlights
Galeria de vídeos de jogadas e momentos do grupo:
- Upload de vídeos (MP4, MOV, etc.) via FilmaEu
- Categorias: **Jogada Bonita** e **Momento Comédia**
- Filtros por categoria, jogador e período
- Edição de título, data, descrição e jogador em destaque
- Modal de tutorial "Como pegar seus Highlights" com passo a passo do FilmaEu

### 👤 Elenco
Lista dos jogadores do grupo com informações de perfil.

### 📞 Contato
Informações de contato e redes sociais do grupo.

---

## 🛠️ Stack Técnica

### Frontend
| Tecnologia | Descrição |
|---|---|
| React 18 + Vite 5 | Interface e bundler |
| Material UI v9 | Componentes visuais |
| React Router DOM v7 | Navegação entre páginas |
| Axios | Requisições HTTP |

### Backend
| Tecnologia | Descrição |
|---|---|
| Node.js + Express 4 | Servidor REST API |
| Mongoose 8 | ODM para MongoDB |
| Multer v2 | Processamento de uploads |
| Cloudinary SDK | Armazenamento em nuvem |

### Serviços externos
- **MongoDB Atlas** — banco de dados em nuvem
- **Cloudinary** — armazenamento de vídeos, imagens e PDFs
- **Vercel** — hospedagem do frontend
- **Render** — hospedagem do backend

---

## 🚀 Rodando localmente

### Pré-requisitos
- Node.js v18+
- Conta no MongoDB Atlas
- Conta no Cloudinary

### 1. Clone o repositório
```
git clone https://github.com/seu-usuario/titans-volei.git
cd titans-volei
```

### 2. Configure o backend
```
cd server
```

Crie o arquivo `server/.env`:
```
PORT=3001
MONGO_URI=mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/titans-volei
CLIENT_URL=http://localhost:5174
CLOUDINARY_CLOUD_NAME=<seu_cloud_name>
CLOUDINARY_API_KEY=<sua_api_key>
CLOUDINARY_API_SECRET=<seu_api_secret>
```

Instale as dependências e inicie:
```
npm install
node index.js
```

### 3. Configure o frontend

Na raiz do projeto, crie o arquivo `.env.local`:
```
VITE_API_URL=http://localhost:3001
```

Instale as dependências e inicie:
```
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5174`.

---

## ☁️ Deploy em produção

### Frontend — Vercel
1. Conecte o repositório no Vercel
2. Adicione a variável de ambiente:
   - `VITE_API_URL` = URL do backend no Render (ex: `https://titans-volei-api.onrender.com`)
3. O arquivo `vercel.json` já está configurado para SPA (reescritas de rota)

### Backend — Render
1. Crie um **Web Service** apontando para a pasta `server/`
2. Comando de build: `npm install`
3. Comando de start: `node index.js`
4. Adicione as variáveis de ambiente:

| Variável | Descrição |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | String de conexão do MongoDB Atlas |
| `CLIENT_URL` | URL do frontend no Vercel (sem barra no final) |
| `CLOUDINARY_CLOUD_NAME` | Nome do cloud no Cloudinary |
| `CLOUDINARY_API_KEY` | Chave de API do Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret do Cloudinary |

---

## 📁 Estrutura do Projeto

```
titans-volei/
├── src/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Calendario.jsx
│   │   ├── Mensalistas.jsx
│   │   ├── Presenca.jsx
│   │   ├── Comprovantes.jsx
│   │   ├── Highlights.jsx
│   │   ├── Elenco.jsx
│   │   └── Contato.jsx
│   ├── services/
│   │   └── api.js
│   └── utils/
│       └── holidays.js
├── server/
│   ├── models/
│   │   ├── Attendance.js
│   │   ├── MonthlyMember.js
│   │   ├── Payment.js
│   │   ├── Session.js
│   │   └── Highlight.js
│   ├── routes/
│   │   ├── attendance.js
│   │   ├── monthlyMembers.js
│   │   ├── sessions.js
│   │   ├── upload.js
│   │   └── highlights.js
│   ├── config/
│   │   └── cloudinary.js
│   └── index.js
├── vercel.json
└── render.yaml
```

---

## 📌 Observações

- Sessões são geradas automaticamente para as sextas-feiras do mês selecionado
- Feriados nacionais são detectados automaticamente e indicados no calendário e na presença
- Comprovantes anexados em Mensalistas ou Presença aparecem automaticamente em Comprovantes
- Ao excluir um comprovante em Comprovantes, o ícone é removido automaticamente nas demais telas
- Avulsos marcados como **SUB** não são contabilizados financeiramente (substituem mensalistas)
