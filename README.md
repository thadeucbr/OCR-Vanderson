# Validador de PDFs de Seguros

Solução completa (Front + Back) em TypeScript para validação de documentos de seguros usando inteligência artificial (OpenAI).

## 🎯 Funcionalidades

- ✅ Upload de múltiplos PDFs em formato ZIP
- ✅ Extração de dados (OCR + PDFs de texto)
- ✅ Análise com IA (OpenAI GPT-4o-mini)
- ✅ Validação automática de dados pessoais e vehiculares
- ✅ Detecção de divergências between documentos
- ✅ Histórico de análises (MongoDB)
- ✅ Interface responsiva em React

## 📋 Pré-requisitos

- Node.js 18+ 
- MongoDB (local ou Atlas)
- Chave API da OpenAI

## 🚀 Instalação Rápida

### 1. Clone e entre no diretório

```bash
cd "OCR Vanderson"
```

### 2. Instale dependências do Backend

```bash
cd backend
npm install
```

### 3. Configure variáveis de ambiente (Backend)

```bash
cp .env.example .env
```

Edite `.env` e preencha:
```
OPENAI_API_KEY=sua_chave_aqui
MONGODB_URI=mongodb://localhost:27017/seguros-validator
```

### 4. Instale dependências do Frontend

```bash
cd ../frontend
npm install
```

## ▶️ Execução

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```
Servidor iniciará em `http://localhost:3001`

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```
Aplicação iniciará em `http://localhost:5173`

## 📦 Build para Produção

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

## 🏗️ Estrutura do Projeto

```
OCR Vanderson/
├── backend/
│   ├── src/
│   │   ├── config/       (Env, OpenAI, Database)
│   │   ├── middleware/   (Error handler)
│   │   ├── models/       (MongoDB schemas)
│   │   ├── routes/       (API routes)
│   │   ├── services/     (ZIP, PDF, Analysis, AI)
│   │   ├── types/        (TypeScript interfaces)
│   │   └── server.ts     (Entry point)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   (FileUpload, ResultCard, History)
│   │   ├── pages/        (MainPage)
│   │   ├── services/     (API client)
│   │   ├── styles/       (CSS)
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### POST `/api/analyze`
Analisa um arquivo ZIP contendo PDFs
- **Body**: `multipart/form-data` com arquivo ZIP
- **Response**: Resultado da análise com divergências

### GET `/api/analyses/:id`
Recupera análise por ID

### GET `/api/analyses?page=1&limit=10`
Lista histórico de análises

## 🤖 Fluxo de Análise

1. **Upload ZIP** → Extração de arquivos PDF
2. **Extração de Texto** → PDF-parse (texto) + OCR (imagens)
3. **Análise IA** → OpenAI extrai dados estruturados
4. **Comparação** → Detecta divergências entre documentos
5. **Armazenamento** → Salva no MongoDB
6. **Resultado** → Retorna status (OK / Divergências / Erro)

## 📊 Dados Extraídos

### Dados Pessoais
- CPF
- Nome
- Endereço
- Telefone
- Email

### Dados Veiculares
- Chassi (VIN)
- Marca
- Modelo
- Placa
- Ano
- Cor

## ⚠️ Tipos de Divergências Detectadas

- **missing_field**: Campo obrigatório não encontrado
- **inconsistent_data**: Dados diferentes entre documentos
- **invalid_format**: Formato inválido (CPF, placa, etc)
- **anomaly**: Padrões suspeitos ou anômalos

## 🛠️ Tecnologias

### Backend
- Express.js - Framework web
- OpenAI API - IA para análise
- MongoDB + Mongoose - Persistência
- pdf-parse / pdfjs-dist - Extração de PDF
- Tesseract.js - OCR
- TypeScript - Tipagem

### Frontend
- React 18 - UI
- Vite - Build tool
- Axios - HTTP client
- TypeScript - Tipagem

## 🔐 Segurança

- Validação de entrada (ZIP apenas)
- Limite de tamanho de arquivo (50MB)
- Sanitização de texto de PDFs
- Variáveis de ambiente para secrets
- CORS configurado

## 💡 Próximas Melhorias

- [ ] Autenticação de usuários
- [ ] Dashboard com gráficos
- [ ] Exportar resultados (PDF/Excel)
- [ ] Webhook para integrações
- [ ] Cache de resultados
- [ ] Rate limiting

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Se `OPENAI_API_KEY` está corretamente configurada
2. Se MongoDB está rodando
3. Se as portas 3001 e 5173 estão livres

## 📄 Licença

MIT
