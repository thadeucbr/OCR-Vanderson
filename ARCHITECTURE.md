# 🎯 Resumo Técnico do Projeto

## 📊 Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    NAVEGADOR (FRONTEND)                 │
│                  http://localhost:5173                  │
│                                                         │
│    React 18 + Vite + TypeScript (~13 packages)         │
│    ├── Upload ZIP                                       │
│    ├── Visualização de Resultados                      │
│    └── Histórico de Análises                           │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   API BACKEND                           │
│               http://localhost:3001                    │
│                                                        │
│   Express.js + Node.js + TypeScript (~25 packages)   │
│   ├── POST /api/analyze                               │
│   ├── GET  /api/analyses/:id                          │
│   └── GET  /api/analyses (paginated)                 │
└────────────────┬──────────────┬───────────────────────┘
                 │              │
          ┌──────┘              └──────┐
          ↓                             ↓
┌──────────────────┐          ┌──────────────────┐
│  PDF Processing  │          │     OpenAI       │
│                  │          │    GPT-4o-mini   │
│  • pdf-parse     │          │                  │
│  • pdfjs-dist    │          │  • Extract data  │
│  • tesseract.js  │          │  • Detect issues │
│  (extração PDF)  │          │  • JSON output   │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         └──────────────┬──────────────┘
                        │
                        ↓
                ┌──────────────────┐
                │     MongoDB      │
                │ port 27017       │
                │                  │
                │  • Análises      │
                │  • Histórico     │
                │  • Timestamps    │
                └──────────────────┘
```

## 🔄 Fluxo de Dados

```
1. [USER] Escolhe ZIP file
   ↓
2. [FRONTEND] Envia arquivo via FormData (multipart)
   ↓
3. [BACKEND] Recebe file in busboy stream
   ↓
4. [ZIPSERVICE] Extrai PDFs em memória (unzipper)
   ↓
5. [PDFSERVICE] Estratégia de Extração em Cascata
   ├─→ 1. Tentativa Texto Nativo (pdf-parse)
   │      └─→ Se > 50 chars: Sucesso
   ├─→ 2. Fallback OCR Local (Tesseract.js)
   │      └─→ Se texto insuficiente em 1
   │      └─→ Gera confiança média (%)
   └─→ 3. Decisão de Fluxo
          ├─→ Se Texto Rico + Alta Confiança (>80%): Via Texto (Rápido/Barato)
          └─→ Se Texto Pobre/Baixa Confiança: Via Vision (Lento/Preciso)
   ↓
6. [ANALYSISSERVICE] Processamento Inteligente (via OpenAI):
   ├─→ Rota Texto: Envia texto extraído para GPT-4o-mini
   ├─→ Rota Vision: Renderiza páginas como imagens -> GPT-4o-mini Vision
   │      └─→ Validação cruzada de evidências (OCR vs Imagem)
   ├─→ Recebe JSON estruturado e normalizado
   └─→ Armazena em array
   ↓
7. [ANALYSISSERVICE] Se 2+ PDFs:
   ├─→ Envia todos os dados para OpenAI
   ├─→ IA compara e detecta divergências
   └─→ Retorna lista de issues
   ↓
8. [ANALYSISMODEL] Salva resultado no MongoDB
   ↓
9. [APIResponse] Retorna JSON com status + divergências
   ↓
10. [FRONTEND] Exibe resultado:
    ├─→ Se OK: "Documentos aptos para prosseguimento"
    └─→ Se divergências: Lista cada uma com detalhes
```

## 📋 Stack Técnico

### Backend
| Componente | Tecnologia | Versão |
|-----------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | ^4.18.2 |
| Linguagem | TypeScript | ^5.3.3 |
| Database ORM | Mongoose | ^8.0.2 |
| PDF Text | pdf-parse | ^1.1.1 |
| PDF Rendering | pdfjs-dist | ^4.0.379 |
| OCR | tesseract.js | ^5.0.4 |
| ZIP Extract | unzipper | ^0.10.14 |
| HTTP Multipart | busboy | ^1.6.0 |
| AI API | openai | ^4.24.1 |
| Dev Tools | tsx | ^4.7.0 |

### Frontend
| Componente | Tecnologia | Versão |
|-----------|-----------|---------|
| UI Framework | React | ^18.2.0 |
| Build | Vite | ^5.0.8 |
| Linguagem | TypeScript | ^5.3.3 |
| HTTP Client | Axios | ^1.6.2 |
| Dev Server | Vite | ^5.0.8 |

### Database
| Componente | Tecnologia |
|-----------|-----------|
| BD | MongoDB 6.0+ |
| Driver | Mongoose ^8.0 |
| Collections | Analysis |

### External Services
| Serviço | Provider | Plano |
|---------|----------|-------|
| IA | OpenAI | ChatGPT API (gpt-4o-mini) |

### 👁️ Estratégia de OCR e Visão

O sistema utiliza uma abordagem em camadas para garantir a extração de dados mesmo em documentos digitalizados com baixa qualidade:

1. **Camada 1: Extração de Texto (pdf-parse)**
   - Prioridade para PDFs nativos (text-based).
   - Extração rápida e sem custo de tokens de imagem.

2. **Camada 2: OCR Local (Tesseract.js)**
   - Ativado automaticamente quando pdf-parse falha.
   - Renderização de alta qualidade das páginas.
   - Cálculo de score de confiança médio.
   - **Fail-fast**: Se confiança < 60% ou texto < 20 chars, descarta resultado para forçar uso do Vision.

3. **Camada 3: GPT Vision (GPT-4o-mini)**
   - **Ultimate Fallback**: Acionado quando Texto e OCR falham ou têm baixa confiança (<80%).
   - Analisa visualmente o documento (como um humano).
   - Extrai dados com "evidências" (trechos exatos lidos) para validação.
   - Capaz de ler manuscritos, carimbos e layouts complexos que quebram parsers tradicionais.

## � Estrutura de Pastas

```
OCR Vanderson/
│
├── 📄 README.md                 # Documentação principal
├── 📄 SETUP.md                  # Guia de instalação
├── 📄 TESTING.md                # Guia de testes
├── 📄 API.md                    # Documentação da API
├── 📄 .gitignore               # Arquivos ignorados no Git
│
├── 🔧 start-dev.bat            # Script inicialização Windows
├── 🔧 start-dev.sh             # Script inicialização Linux/Mac
│
├── 📁 backend/
│   ├── 📄 package.json         # Dependências Node
│   ├── 📄 tsconfig.json        # Config TypeScript
│   ├── 📄 .env.example         # Template variáveis
│   ├── 📄 .env                 # Variáveis (NÃO commit!)
│   ├── 📄 .gitignore
│   │
│   └── 📁 src/
│       ├── 📄 server.ts        # Entry point Express
│       │
│       ├── 📁 config/
│       │   ├── env.ts          # Carregamento variáveis
│       │   ├── openai.ts       # Cliente OpenAI + prompts
│       │   └── database.ts     # Conexão MongoDB
│       │
│       ├── 📁 middleware/
│       │   └── errorHandler.ts # Tratamento erros
│       │
│       ├── 📁 routes/
│       │   └── analysisRoutes.ts # Rotas /api/*
│       │
│       ├── 📁 services/
│       │   ├── zipService.ts     # Extração ZIP
│       │   ├── pdfService.ts     # Extração PDF/OCR
│       │   └── analysisService.ts # Orquestração fluxo
│       │
│       ├── 📁 models/
│       │   └── analysis.ts     # Schema MongoDB + CRUD
│       │
│       └── 📁 types/
│           └── analysis.ts     # TypeScript interfaces
│
├── 📁 frontend/
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 tsconfig.node.json
│   ├── 📄 vite.config.ts       # Config build Vite
│   ├── 📄 index.html            # HTML entry
│   ├── 📄 .gitignore
│   │
│   └── 📁 src/
│       ├── 📄 main.tsx         # React entry point
│       ├── 📄 App.tsx          # Root component
│       ├── 📄 App.css
│       │
│       ├── 📁 pages/
│       │   └── MainPage.tsx    # Página principal
│       │
│       ├── 📁 components/
│       │   ├── FileUpload.tsx  # Drop zone upload
│       │   ├── ResultCard.tsx  # Card resultados
│       │   └── AnalysisHistory.tsx # Histórico
│       │
│       ├── 📁 services/
│       │   └── api.ts          # Axios client
│       │
│       └── 📁 styles/
│           ├── main.css        # Reset + root vars
│           ├── upload.css
│           ├── result-card.css
│           ├── history.css
│           └── main-page.css
```

## 🔐 Variáveis de Ambiente

### Backend (.env)
```env
PORT=3001                                    # Porta do servidor
MONGODB_URI=mongodb://localhost:27017/...   # String conexão DB
OPENAI_API_KEY=sk-...                       # Chave OpenAI (obrigatória!)
NODE_ENV=development                        # environment
CORS_ORIGIN=http://localhost:5173           # Frontend URL
```

## 🚀 Scripts Disponíveis

### Backend
```bash
npm install          # Instalar dependências
npm run dev          # Rodar em desenvolvimento (hot-reload)
npm run build        # Compilar TypeScript → JavaScript
npm run start        # Executar versão compilada
npm run typecheck    # Verificar erros de tipo
```

### Frontend
```bash
npm install          # Instalar dependências
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Build para produção
npm run preview      # Preview da build
npm run typecheck    # Verificar erros de tipo
```

## 📊 Capacidades

| Feature | Status | Notas |
|---------|--------|-------|
| Upload ZIP | ✅ | Max 50MB |
| PDF Texto | ✅ | Searchable PDFs |
| OCR | ✅ | Tesseract.js |
| IA Extract | ✅ | OpenAI GPT-4o-mini |
| Comparação | ✅ | 2+ documentos |
| Histórico | ✅ | MongoDB persistidos |
| Paginação | ✅ | 10 por página default |
| Responsivo | ✅ | Mobile + Desktop |
| TypeScript | ✅ | Strict mode |
| Error Handling | ✅ | Tratamento completo |

## 🔄 Fluxo de Requisição Completo

```
REQUEST: POST /api/analyze
         boundary=----WebKitFormBoundary...
         file: test.zip (binary 2.5 MB)

↓ BACKEND

1. busboy parse multipart
   ✓ Arquivo recebido em stream
   
2. zipService.extractZipBuffer()
   ✓ 2 PDFs extraídos em memória
   
3. Para cada PDF:
   a) pdfService.extractTextFromPDF()
      ✓ Tenta pdf-parse -> Tesseract
      ✓ Retorna texto + confiança
   
   b) analysisService: Decisão de Rota
      ✓ Confiança > 80%? -> Rota Texto
      ✓ Confiança < 80%? -> Rota Vision (Render + GPT Vision)
   
   c) openai.extractData...() (Texto ou Vision)
      RESPONSE: {"personalData": {...}, "vehicleData": {...}}
      ✓ Dados estruturados recebidos
   
4. analysisService -> openai.detectDivergencies()
   INPUT: [doc1_data, doc2_data]
   PROMPT: "Compare e identifique divergências..."
   RESPONSE: {"divergencies": [{type: "inconsistent_data", ...}]}
   ✓ Divergências detectadas

5. analysis.saveAnalysis()
   ✓ Resultado salvo no MongoDB
   
6. API Response
   {
     "success": true,
     "analysisId": "507f191e810c19729de860ea",
     "status": "divergencies",
     "message": "Documentos analisados: 2. Divergências: 1",
     "pdfContents": [...],
     "divergencies": [
       {
         "type": "inconsistent_data",
         "field": "placa",
         "file1": "doc1.pdf",
         "file2": "doc2.pdf",
         "value1": "ABC-1234",
         "value2": "ABC-5678",
         "description": "..."
       }
     ],
     "timestamp": "2026-02-10T15:30:45.123Z"
   }

↓ FRONTEND

7. API call bem-sucedida
   ✓ setState(result)
   
8. ResultCard renderiza
   ✓ Status: "divergencies"
   ✓ Lista cada divergência
   ✓ Usuário vê detalhes
```

## 💾 Modelo de Dados (MongoDB)

```javascript
Analysis {
  _id: ObjectId,
  status: "ok" | "divergencies" | "error",
  message: string,
  pdfContents: [
    {
      fileName: string,
      personalData: {
        cpf?: string,
        nome?: string,
        endereco?: string,
        telefone?: string,
        email?: string
      },
      vehicleData: {
        chassi?: string,
        marca?: string,
        modelo?: string,
        placa?: string,
        ano?: string,
        cor?: string
      }
    }
  ],
  divergencies: [
    {
      type: "missing_field" | "inconsistent_data" | "invalid_format" | "anomaly",
      field: string,
      file1: string,
      file2?: string,
      value1?: string,
      value2?: string,
      description: string
    }
  ],
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Performance Benchmarks

| Operação | Tempo | Notas |
|----------|-------|-------|
| Parse ZIP 2 PDFs | ~100ms | Em memória |
| Extract PDF 5 pgs | ~200ms | pdf-parse |
| OpenAI Call (1 doc) | ~3-5s | API latency |
| OpenAI Call (comparação) | ~3-5s | Comparação IA |
| MongoDB Insert | ~10ms | Índices default |
| **Total (2 PDFs)** | **~10-20s** | End-to-end |

## Limitações Conhecidas

1. **Tamanho**: Max 50MB por ZIP (configurável em Express)
2. **Idioma**: IA treinada melhor em PT-BR e EN
3. **PDFs Complex**: Layouts muito complexos podem confundir a IA
4. **Rate Limit**: OpenAI limita a ~3500 requests/min (free tier)
5. **Custo**: Cada análise custa ~$0.01 em tokens OpenAI
6. **Timeout**: Requisição timeout em 5 minutos

## 🔐 Segurança

- ✅ Variáveis de ambiente (não hardcode)
- ✅ Validação de ZIP MIME type
- ✅ Tamanho máximo de arquivo
- ✅ CORS configurado
- ✅ Input sanitization
- ✅ Error handling sem stack traces
- ✅ MongoDB com índices
- ❌ Sem autenticação (adicionar se necessário)
- ❌ Sem rate limiting (adicionar se necessário)

---

**Última atualização:** 10 de Fevereiro de 2026
**Versão:** 1.0.0
