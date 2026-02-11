# 🚀 Guia de Deployment

## Pré-requisitos

- [x] Node.js 18+
- [x] Git
- [x] Conta Cloud (Azure, AWS, Heroku, Railway) - Opcional
- [x] MongoDB Atlas (cloud) ou instância local
- [x] OpenAI API key

---

## Option 1: Deploy Local (Computador)

### Windows

#### Passo 1: Instalar MongoDB (se ainda não tiver)

1. Baixe em: https://www.mongodb.com/try/download/community
2. Execute instalador e siga wizard
3. MongoDB será iniciado como serviço Windows

Verificar se está rodando:
```powershell
mongosh mongodb://localhost:27017
```

#### Passo 2: Build dos Projetos

**Backend:**
```powershell
cd backend
npm run build

# Resultado: pasta 'dist/' criada
```

**Frontend:**
```powershell
cd frontend
npm run build

# Resultado: pasta 'dist/' criada
```

#### Passo 3: Configurar .env para Produção

**backend/.env:**
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/seguros-validator
OPENAI_API_KEY=sk-...sua-chave...
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173 ou seu-dominio.com
```

#### Passo 4: Iniciar Servidores

**Backend**
```powershell
cd backend
npm start  # Roda dist/server.js

# Esperado: "✓ Server running on port 3001"
```

**Frontend (serve estático)**
```powershell
# Opção A: Servir com Python
cd frontend\dist
python -m http.server 5173

# Opção B: Servir com Node
npm install -g serve
serve -s dist -l 5173
```

Acesse: http://localhost:5173

---

## Option 2: Deploy em Docker

### Dockerfile - Backend

Crie `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build
RUN npm run build

# Remove dev dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 3001

# Start
CMD ["npm", "start"]
```

### Dockerfile - Frontend

Crie `frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: seguros-validator
    volumes:
      - mongodb_data:/data/db
    restart: always

  backend:
    build: ./backend
    container_name: backend
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/seguros-validator
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
      - CORS_ORIGIN=http://localhost:5173
    depends_on:
      - mongodb
    restart: always

  frontend:
    build: ./frontend
    container_name: frontend
    ports:
      - "5173:80"
    depends_on:
      - backend
    restart: always

volumes:
  mongodb_data:

networks:
  default:
    name: seguros-network
```

### Executar

```bash
# Criar e iniciar containers
docker-compose up -d

# Verificar status
docker-compose ps

# Logs
docker-compose logs -f

# Parar
docker-compose down
```

---

## Option 3: Deploy em Railway

Railway é a plataforma mais fácil para este projeto.

### Passo 1: Preparar Repositório

1. Crie conta em https://railway.app
2. Conecte seu GitHub
3. Crie novo projeto

### Passo 2: Variáveis de Ambiente

No painel Railway, adicione:

```env
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net
NODE_ENV=production
```

### Passo 3: Deploy Automático

Railway detecta automaticamente `package.json` e `build` scripts.

Backend railway.json:
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "start": "npm run build && npm start"
}
```

Frontend railway.json:
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "start": "npm run build && npm install -g serve && serve -s dist -l 3000"
}
```

### URLs Automáticas

- Backend: `https://seu-backend-random.railway.app`
- Frontend: `https://seu-frontend-random.railway.app`

---

## Option 4: Deploy em Cloud Run (Google)

### Passo 1: Setup

Instale Google Cloud CLI: https://cloud.google.com/sdk/docs/install

```bash
gcloud init
gcloud auth login
```

### Passo 2: Deploy Backend

```bash
cd backend

# Create Dockerfile para Cloud Run
# (Use o Dockerfile acima)

# Deploy
gcloud run deploy seguros-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --set-env-vars OPENAI_API_KEY=sk-...

# Resultado: https://seguros-backend-xxx.run.app
```

### Passo 3: Deploy Frontend

```bash
cd frontend

# Build
npm run build

# Deploy estático com Cloud Storage + CDN
gsutil -m cp -r dist/* gs://seu-bucket-name/
```

---

## Option 5: Deploy em Azure App Service

### Passo 1: Setup

```bash
# Instalar Azure CLI
# https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

az login
```

### Passo 2: Criar Recursos

```bash
# Resource Group
az group create \
  --name seguros-rg \
  --location eastus

# App Service Plan
az appservice plan create \
  --name seguros-plan \
  --resource-group seguros-rg \
  --sku B1 \
  --is-linux

# App Service - Backend
az webapp create \
  --resource-group seguros-rg \
  --plan seguros-plan \
  --name seguros-backend \
  --runtime "NODE|18-lts"

# App Service - Frontend
az webapp create \
  --resource-group seguros-rg \
  --plan seguros-plan \
  --name seguros-frontend \
  --runtime "STATICSITE"
```

### Passo 3: Deploy

```bash
# Backend
cd backend && npm run build
az webapp deployment source config-zip \
  --resource-group seguros-rg \
  --name seguros-backend \
  --src backend.zip

# Frontend
cd frontend && npm run build
az staticwebapp create \
  --name seguros-frontend \
  --resource-group seguros-rg \
  --source ./dist
```

---

## Checklist de Deployment

### Antes de Publicar

- [ ] **Environment Variables**
  - [ ] OPENAI_API_KEY configurada ✓
  - [ ] MONGODB_URI correta ✓
  - [ ] CORS_ORIGIN atualizada ✓
  - [ ] NODE_ENV=production ✓

- [ ] **Build**
  - [ ] `npm run typecheck` sem erros ✓
  - [ ] `npm run build` bem-sucedido ✓
  - [ ] Nenhum arquivo `.env` em controle de versão ✓

- [ ] **Backend**
  - [ ] Porta correta (3001) ✓
  - [ ] MongoDB acessível ✓
  - [ ] OpenAI API testada ✓
  - [ ] Logs de startup OK ✓

- [ ] **Frontend**
  - [ ] Build otimizado gerado ✓
  - [ ] API URL correta em config ✓
  - [ ] Sem console erros/warnings ✓
  - [ ] Responsive em mobile ✓

- [ ] **Segurança**
  - [ ] Sem credentials commitadas ✓
  - [ ] HTTPS habilitado ✓
  - [ ] CORS restringido ✓
  - [ ] Rate limiting implementado ✓

- [ ] **Testes**
  - [ ] Teste de upload em prod ✓
  - [ ] Teste de análise completa ✓
  - [ ] Teste de histórico ✓
  - [ ] Teste de erro handling ✓

- [ ] **Monitoring**
  - [ ] Logs habilitados ✓
  - [ ] Alertas configurados ✓
  - [ ] Health check endpoint funcionando ✓

---

## Variáveis de Ambiente para Produção

### Backend

```env
# Server
PORT=3001
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/seguros-validator

# OpenAI
OPENAI_API_KEY=sk-...chave-real...

# CORS
CORS_ORIGIN=https://seu-dominio.com

# Logging
LOG_LEVEL=info
```

### Frontend

```env
VITE_API_URL=https://api.seu-dominio.com
```

---

## Monitoramento

### Logs

```bash
# Docker
docker logs -f <container_name>

# Railway
railway logs

# Cloud Run
gcloud run logs read --limit 50

# Azure
az webapp log tail --name seu-app --resource-group seu-rg
```

### Métricas Importantes

1. **Response Time**
   - Backend: < 500ms (sem OpenAI)
   - OpenAI: 3-30s
   
2. **Uptime**
   - Meta: 99.9%
   - Monitorar com alerts

3. **Erros**
   - API errors < 1%
   - Database connection: sempre OK

4. **Custo (OpenAI)**
   - ~$0.01 por análise (2 PDFs)
   - ~$300/mês para 10k análises

---

## Rollback

Se houver problema:

```bash
# Docker
docker-compose down
docker-compose up -d <versão-anterior>

# Railway
# Reverter no dashboard (histórico de deploys)

# Azure
az webapp deployment slot swap --name seu-app

# Cloud Run
gcloud run deploy seu-app --image gcr.io/seu-projeto/seu-app:v1
```

---

## Scale em Produção

### Database
```bash
# Aumentar recursos MongoDB Atlas
- Altere no painel Atlas
- Aumentar storage ou throughput
```

### Backend
```bash
# Multiple instances (load balancing)
docker-compose scale backend=3

# Ou usar K8s
kubectl scale deployment backend --replicas=3
```

### Frontend
```bash
# CDN + caching
- Usar CloudFlare ou Cloudfront
- Cache assets por 30 dias
```

---

## Troubleshooting Produção

### Erro: MongoDB connection timeout
```
Solução: Verificar whitelist de IPs no MongoDB Atlas
        ou redefinir string de conexão
```

### Erro: OpenAI rate limit
```
Solução: Implementar queue (Bull/RabbitMQ)
        ou aumentar limite na conta OpenAI
```

### Erro: 413 Payload Too Large
```
Solução: Aumentar limit no Express
        app.use(express.json({ limit: '100mb' }));
```

---

## Performance Tips

1. **Cache results** - Não re-analisar mesmo ZIP
2. **Batch processing** - Processar múltiplos uploads
3. **CDN** - Servir frontend via CDN
4. **Database indexes** - Otimizar MongoDB queries
5. **Rate limiting** - Proteger contra abuso

---

## Atualizar em Produção

```bash
# Novo deployment = zero downtime
1. Build nova versão
2. Deploy paralelo (canary deployment)
3. Testar
4. Redirecionar tráfego
5. Remover versão antiga

# Exemplo Railway:
git push origin main
# Railway detecta change
# Novo deploy automático
```

---

## SLA & Uptime

Alvo: **99.9% uptime** (43 minutos/mês downtime máximo)

Recomendações:
- Health checks a cada 1 minuto
- Alertas automáticos
- Redundância de database
- Backup diário

---

**Última atualização:** 10 de Fevereiro de 2026  
**Status:** Pronto para Produção ✅
