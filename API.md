# 📡 Documentação da API REST

## Base URL

```
http://localhost:3001
```

## Endpoints

### 1️⃣ Analisar PDF (Upload)

**POST** `/api/analyze`

Analisa um arquivo ZIP contendo múltiplos PDFs de seguros.

#### Request

**Content-Type:** `multipart/form-data`

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-----------|-----------|
| file | File (ZIP) | ✅ Sim | Arquivo ZIP contendo PDFs |

**Exemplo cURL:**
```bash
curl -X POST http://localhost:3001/api/analyze \
  -F "file=@test.zip"
```

**Exemplo JavaScript/Fetch:**
```javascript
const formData = new FormData();
formData.append('file', zipFile); // File object

const response = await fetch('http://localhost:3001/api/analyze', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Exemplo Axios:**
```javascript
const formData = new FormData();
formData.append('file', zipFile);

const result = await axios.post('http://localhost:3001/api/analyze', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

#### Response

**Status:** 200 OK

```json
{
  "success": true,
  "analysisId": "507f191e810c19729de860ea",
  "status": "ok|divergencies|error",
  "message": "Documentos analisados: 2. ✓ Todos os documentos estão aptos para prosseguimento.",
  "pdfContents": [
    {
      "fileName": "seguro1.pdf",
      "personalData": {
        "cpf": "123.456.789-00",
        "nome": "João da Silva",
        "endereco": "Rua Principal, 123 - São Paulo, SP",
        "telefone": "(11) 98765-4321",
        "email": "joao@example.com"
      },
      "vehicleData": {
        "chassi": "9BWSU2K51D5M45678",
        "marca": "Toyota",
        "modelo": "Corolla",
        "placa": "ABC-1234",
        "ano": "2022",
        "cor": "Preto"
      }
    },
    {
      "fileName": "seguro2.pdf",
      "personalData": {
        "cpf": "123.456.789-00",
        "nome": "João da Silva",
        "endereco": "Rua Principal, 123 - São Paulo, SP",
        "telefone": "(11) 98765-4321",
        "email": "joao@example.com"
      },
      "vehicleData": {
        "chassi": "9BWSU2K51D5M45678",
        "marca": "Toyota",
        "modelo": "Corolla",
        "placa": "ABC-1234",
        "ano": "2022",
        "cor": "Preto"
      }
    }
  ],
  "divergencies": [],
  "timestamp": "2026-02-10T15:30:45.123Z"
}
```

#### Error Response

**Status:** 400 Bad Request

```json
{
  "error": "Nenhum arquivo foi enviado",
  "status": "error"
}
```

**Status:** 500 Internal Server Error

```json
{
  "error": "Erro ao processar arquivo: Invalid PDF",
  "status": "error"
}
```

#### Possíveis Status

| Status | Significado | O que fazer |
|--------|-----------|----------|
| `ok` | Todos documentos válidos | Prosseguir com documentos |
| `divergencies` | Inconsistências encontradas | Revisar e corrigir dados |
| `error` | Erro no processamento | Verificar arquivo e tentar novamente |

#### Tipos de Divergência

```typescript
type DivergencyType = 
  | 'missing_field'      // Campo faltante em algum doc
  | 'inconsistent_data'  // Valores diferentes entre docs
  | 'invalid_format'     // Formato inválido (CPF, placa)
  | 'anomaly'           // Padrão suspeito detectado
```

#### Exemplo com Divergência

```json
{
  "status": "divergencies",
  "divergencies": [
    {
      "type": "inconsistent_data",
      "field": "placa",
      "file1": "seguro1.pdf",
      "file2": "seguro2.pdf",
      "value1": "ABC-1234",
      "value2": "ABC-5678",
      "description": "A placa do veículo difere entre os documentos"
    },
    {
      "type": "missing_field",
      "field": "telefone",
      "file1": "seguro3.pdf",
      "description": "Campo telefone não encontrado neste documento"
    }
  ]
}
```

---

### 2️⃣ Obter Análise por ID

**GET** `/api/analyses/:id`

Recupera uma análise previamente realizada pelo seu ID.

#### Request

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-----------|----------|
| id | String (MongoDB ID) | ✅ Sim | ID da análise |

**Exemplo cURL:**
```bash
curl http://localhost:3001/api/analyses/507f191e810c19729de860ea
```

**Exemplo JavaScript:**
```javascript
const response = await fetch(
  'http://localhost:3001/api/analyses/507f191e810c19729de860ea'
);
const analysis = await response.json();
```

#### Response

**Status:** 200 OK

```json
{
  "success": true,
  "data": {
    "_id": "507f191e810c19729de860ea",
    "status": "ok",
    "message": "Documentos analisados: 2. ✓ Todos aptos.",
    "pdfContents": [...],
    "divergencies": [],
    "timestamp": "2026-02-10T15:30:45.123Z",
    "createdAt": "2026-02-10T15:30:45.123Z",
    "updatedAt": "2026-02-10T15:30:45.123Z"
  }
}
```

#### Error Response

**Status:** 404 Not Found

```json
{
  "error": "Análise não encontrada",
  "status": "error"
}
```

---

### 3️⃣ Listar Análises

**GET** `/api/analyses`

Lista todas as análises com suporte a paginação.

#### Request

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| page | Number (query) | 1 | Número da página |
| limit | Number (query) | 10 | Itens por página |

**Exemplos cURL:**
```bash
# Primeira página (10 itens)
curl http://localhost:3001/api/analyses

# Página 2 com 5 itens por página
curl "http://localhost:3001/api/analyses?page=2&limit=5"

# Com ordenação (automática: mais recente primeiro)
curl "http://localhost:3001/api/analyses"
```

**Exemplo JavaScript:**
```javascript
// Página 1, 10 itens
const response = await fetch('http://localhost:3001/api/analyses');
const { data, pagination } = await response.json();

// Página 2, 5 itens
const response = await fetch(
  'http://localhost:3001/api/analyses?page=2&limit=5'
);
```

#### Response

**Status:** 200 OK

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f191e810c19729de860ea",
      "status": "divergencies",
      "message": "Documentos analisados: 2. Divergências: 1",
      "pdfContents": [
        {
          "fileName": "doc1.pdf",
          "personalData": {...},
          "vehicleData": {...}
        }
      ],
      "divergencies": [
        {
          "type": "inconsistent_data",
          "field": "placa",
          "file1": "doc1.pdf",
          "file2": "doc2.pdf",
          "value1": "ABC-1234",
          "value2": "XYZ-5678",
          "description": "..."
        }
      ],
      "timestamp": "2026-02-10T15:30:45.123Z",
      "createdAt": "2026-02-10T15:30:45.123Z",
      "updatedAt": "2026-02-10T15:30:45.123Z"
    },
    {
      "_id": "507f191e810c19729de860eb",
      "status": "ok",
      "message": "Documentos analisados: 1. ✓ Documento apto.",
      "pdfContents": [...],
      "divergencies": [],
      "timestamp": "2026-02-08T10:15:30.000Z",
      "createdAt": "2026-02-08T10:15:30.000Z",
      "updatedAt": "2026-02-08T10:15:30.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Campos da Paginação

| Campo | Tipo | Descrição |
|-------|------|-----------|
| page | Number | Página atual |
| limit | Number | Itens por página |
| total | Number | Total de análises no banco |
| pages | Number | Total de páginas |

---

## Status Codes

| Código | Descrição | Ação |
|--------|-----------|------|
| 200 | OK - Requisição bem-sucedida | Processar resposta |
| 400 | Bad Request - Dados inválidos | Verificar parâmetros |
| 404 | Not Found - Recurso não existe | ID inválido? |
| 500 | Internal Error - Erro no servidor | Revisar logs; tente novamente |

---

## Autenticação

**Atual:** Nenhuma (API pública)

**Futuro:** Adicionar JWT tokens se necessário

```javascript
// Exemplo futuro com Auth:
const response = await fetch('http://localhost:3001/api/analyze', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
```

---

## Rate Limiting

**Atual:** Sem limite

**Recomendação:** Adicionar no futuro
```javascript
// Exemplo: Max 10 requisições por minuto
// Implementar com express-rate-limit
```

---

## CORS

**Configurado para:**
```
Access-Control-Allow-Origin: http://localhost:5173
```

Ajuste em `backend/.env`:
```env
CORS_ORIGIN=http://seu-frontend.com
```

---

## Exemplos Práticos

### Exemplo 1: Analisar ZIP e Lidar com Resultado

```javascript
async function analyzeInsuranceDocuments(zipFile) {
  try {
    // 1. Upload arquivo
    const formData = new FormData();
    formData.append('file', zipFile);
    
    const response = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('Upload failed');
    
    const result = await response.json();
    
    // 2. Processar resultado
    if (result.status === 'ok') {
      console.log('✓ Documentos OK!');
      return { success: true, message: result.message };
    }
    
    if (result.status === 'divergencies') {
      console.log('⚠ Divergências encontradas:');
      result.divergencies.forEach(div => {
        console.log(`- ${div.field}: ${div.description}`);
      });
      return { success: false, divergencies: result.divergencies };
    }
    
    if (result.status === 'error') {
      throw new Error(result.message);
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
    return { success: false, error: error.message };
  }
}
```

### Exemplo 2: Paginação de Histórico

```javascript
async function getAnalysisHistory(pageNumber = 1, itemsPerPage = 5) {
  const url = new URL('http://localhost:3001/api/analyses');
  url.searchParams.set('page', pageNumber);
  url.searchParams.set('limit', itemsPerPage);
  
  const response = await fetch(url);
  const { data, pagination } = await response.json();
  
  console.log(`Página ${pagination.page} de ${pagination.pages}`);
  console.log(`Total: ${pagination.total} análises`);
  
  return { analyses: data, pagination };
}
```

### Exemplo 3: Recuperar Análise Anterior

```javascript
async function getAnalysisDetails(analysisId) {
  const response = await fetch(
    `http://localhost:3001/api/analyses/${analysisId}`
  );
  
  if (!response.ok) {
    console.error('Análise não encontrada');
    return null;
  }
  
  const { data } = await response.json();
  
  console.log('Análise:', {
    status: data.status,
    dataHora: new Date(data.timestamp).toLocaleString('pt-BR'),
    arquivos: data.pdfContents.map(p => p.fileName),
    divergencias: data.divergencies.length
  });
  
  return data;
}
```

---

## Webhook Futuro (Não Implementado)

Possível adição para notificações:

```javascript
POST /api/webhooks/subscribe
{
  "url": "https://seu-servidor.com/analysis-complete",
  "event": "analysis_completed"
}
```

---

## Resumo Rápido

| Operação | Endpoint | Método | Dados |
|----------|----------|--------|-------|
| Analisar | `/api/analyze` | POST | ZIP file |
| Ver resultado | `/api/analyses/:id` | GET | ID |
| Listar histórico | `/api/analyses` | GET | page, limit |

---

**Versão API:** 1.0.0  
**Última atualização:** 10 de Fevereiro de 2026
