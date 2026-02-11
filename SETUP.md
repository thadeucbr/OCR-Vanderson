# 🚀 Guia Completo de Setup

## ⚠️ Pré-requisitos Obrigatórios

### 1. Node.js 18+
Baixe em: https://nodejs.org/

Verifique a instalação:
```bash
node --version
npm --version
```

### 2. MongoDB
**Opção A: Local** (Recomendado para desenvolvimento)
- Baixe: https://www.mongodb.com/try/download/community
- Instale e inicie o serviço MongoDB

**Opção B: Atlas (Cloud)**
- Crie conta em https://www.mongodb.com/cloud/atlas
- Crie um cluster gratuito
- Copie a connection string e adicione ao `.env`

Teste a conexão MongoDB:
```bash
mongosh mongodb://localhost:27017
```

### 3. OpenAI API Key
- Crie conta em https://platform.openai.com/
- Gere uma API key em: https://platform.openai.com/account/api-keys
- Salve em local seguro

## 📋 Instalação Passo a Passo

### Windows

1. **Abra PowerShell** como Administrador
   
2. **navegue até o diretório do projeto**
   ```powershell
   cd "C:\Users\thade\OneDrive\Documentos\OCR Vanderson"
   ```

3. **Execute o script de inicialização**
   ```powershell
   .\start-dev.bat
   ```

4. **Configure o arquivo `.env`**
   - Edite `backend\.env`
   - Substitua `seu_openai_api_key_aqui` pela sua chave real
   - Salve o arquivo

### macOS / Linux

1. **Abra Terminal**

2. **Navegue até o diretório do projeto**
   ```bash
   cd ~/OneDrive/Documentos/OCR\ Vanderson
   ```

3. **Dê permissão de execução ao script**
   ```bash
   chmod +x start-dev.sh
   ```

4. **Execute o script de inicialização**
   ```bash
   ./start-dev.sh
   ```

5. **Configure o arquivo `.env`**
   - Edite `backend/.env`
   - Substitua `seu_openai_api_key_aqui` pela sua chave real
   - Salve o arquivo

## ✅ Verificação

Se tudo está funcionando, você deve ver:

```
✓ Backend iniciado em http://localhost:3001
✓ Frontend iniciado em http://localhost:5173
```

Abra seu navegador e acesse: **http://localhost:5173**

## 🛠️ Instalação Manual (sem scripts)

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend (em outro terminal)

```bash
cd frontend
npm install
npm run dev
```

## ⚙️ Configurações Importantes

### Backend - arquivo `backend/.env`

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/seguros-validator
OPENAI_API_KEY=sk-...sua-chave-aqui...
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**OPENAI_API_KEY:**
- Obtenha em https://platform.openai.com/account/api-keys
- Formato: `sk-...` (30+ caracteres)
- ⚠️ Nunca commit este arquivo no Git!

**MONGODB_URI:**
- Local: `mongodb://localhost:27017/seguros-validator`
- Atlas: `mongodb+srv://usuario:senha@cluster.mongodb.net/seguros-validator?retryWrites=true&w=majority`

## 🧪 Testando a Aplicação

### 1. Criar um PDF de teste

Crie um arquivo de texto com dados de seguro:
```
CPF: 123.456.789-00
Nome: João da Silva
Endereço: Rua Principal, 123 - São Paulo, SP
Telefone: (11) 98765-4321
Email: joao@email.com

Veículo:
Chassi: 9BWSU2K51D5M45678
Marca: Toyota
Modelo: Corolla
Placa: ABC-1234
Ano: 2022
Cor: Preto
```

### 2. Converter para PDF
Use qualquer gerador de PDF (ex: VIA Python, Word, Google Docs)

### 3. Criar um ZIP
- Coloque o PDF em uma pasta
- Comprima em formato ZIP
- Nomeia: `test.zip`

### 4. Upload no aplicativo
- Acesse http://localhost:5173
- Faça drag-drop do ZIP
- Clique em "Analisar PDFs"

## 🐛 Troubleshooting

### Erro: "OPENAI_API_KEY is not set"
**Solução:** Verifique se a chave está configurada em `backend/.env`

### Erro: "Cannot connect to MongoDB"
**Solução:** 
- Certifique-se que MongoDB está rodando
- Verifique a conexão string em `.env`
- Teste: `mongosh mongodb://localhost:27017`

### Porta 3001 já em uso
**Solução:**
- Altere a porta em `backend/.env`
- Atualize `frontend/vite.config.ts` com a nova porta

### Frontend não conecta ao backend
**Solução:**
- Verifique se o backend está rodando (http://localhost:3001/health)
- Cheque CORS_ORIGIN em `backend/.env`
- Reinicie ambos os servidores

## 📚 Estrutura de Pastas

```
OCR Vanderson/
├── backend/                 # API Express
│   ├── src/
│   │   ├── config/         # Configurações (env, openai, db)
│   │   ├── middleware/     # Middlewares (erro)
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Lógica (zip, pdf, análise, ia)
│   │   ├── types/          # TypeScript interfaces
│   │   └── server.ts       # Entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .env                # ⚠️ Não fazer commit!
│
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/     # Componentes (Upload, Card, History)
│   │   ├── pages/          # Páginas (MainPage)
│   │   ├── services/       # API client
│   │   ├── styles/         # CSS
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── README.md              # Documentação principal
├── SETUP.md              # Este arquivo
├── start-dev.bat         # Script inicialização (Windows)
└── start-dev.sh          # Script inicialização (Mac/Linux)
```

## 🚀 Próximas Etapas

1. **Configure as credenciais** (OpenAI, MongoDB)
2. **Inicie os servidores**
3. **Teste com um ZIP de exemplo**
4. **Explore a interface**
5. **Customize conforme necessário**

## 💡 Dicas

- Use `npm run dev` para desenvolvimento com hot-reload
- Use `npm run build` para build de produção
- Verifique os logs no console para debug
- Use DevTools do navegador (F12) para debug frontend

## 📞 Problema?

1. Verifique os logs nos terminais
2. Leia a seção Troubleshooting acima
3. Verifique a documentação no README.md

Good luck! 🎉
