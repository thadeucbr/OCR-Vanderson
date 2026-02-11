# 📝 Guia de Testes

## Teste Manual (Sem zip)

### 1. Verificar se os servidores estão rodando

**Backend:**
```bash
curl http://localhost:3001/health
```

Esperado resposta:
```json
{ "status": "ok" }
```

**Frontend:**
Abra http://localhost:5173 no navegador

## Teste com Arquivo ZIP Real

### 1. Criar PDFs de Teste

Crie arquivos PDF com dados de seguros. Aqui está um exemplo em estrutura de texto:

**Arquivo: seguro1.txt** (depois converter para PDF)
```
CONTRATO DE SEGURO AUTOMOTIVO

Dados do Segurado:
- CPF: 123.456.789-00
- Nome Completo: João da Silva Santos
- Endereço: Rua Principal, 123 - Apto 456 - São Paulo, SP 01230-100
- Telefone: (11) 98765-4321
- Email: joao.silva@email.com

Dados do Veículo:
- Número do Chassi: 9BWSU2K51D5M45678
- Fabricante/Marca: Toyota
- Modelo: Corolla
- Placa do Veículo: ABC-1234
- Ano de Fabricação: 2022
- Cor: Preto com Interior Bege

Data de Contrato: 01/01/2024
Vigência: 01/01/2024 a 01/01/2025
```

**Arquivo: seguro2.txt** (este SIM com divergência - placa diferente)
```
APÓLICE DE SEGURO - VEÍCULO AUTOMOTIVO

Dados Pessoais:
Nome: João da Silva Santos
CPF: 123.456.789-00
Telefone: (11) 98765-4321
Endereço: Rua Principal, 123 - Apto 456 - São Paulo, SP 01230-100
Email: joao.silva@email.com

Informações do Automóvel:
Chassi: 9BWSU2K51D5M45678
Marca: Toyota
Modelo: Corolla
Placa: ABC-5678  <-- DIVERGÊNCIA!
Ano: 2022
Cor: Preto

Data de Emissão: 01/01/2024
Cobertura Válida Até: 01/01/2025
```

### 2. Converter para PDF

**Opção A: Microsoft Word**
1. Cola o texto no Word
2. Salva como PDF

**Opção B: Google Docs**
1. Cria novo documento no Google Docs
2. Cola o texto
3. Arquivo → Download → PDF

**Opção C: Python (simplificado)**
```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def text_to_pdf(text, filename):
    c = canvas.Canvas(filename, pagesize=letter)
    y = 750
    for line in text.split('\n'):
        if y < 50:
            c.showPage()
            y = 750
        c.drawString(50, y, line)
        y -= 15
    c.save()

# Usar a função acima para cada arquivo
```

### 3. Criar ZIP

1. Coloque os PDFs em uma pasta, ex: `PDFs_teste/`
2. Comprima com WinRAR, 7-Zip ou Windows Explorer
3. Renomeie para `test.zip`

A estrutura deve ficar:
```
test.zip
├── seguro1.pdf
└── seguro2.pdf
```

### 4. Fazer Upload na Aplicação

1. Abra http://localhost:5173
2. Arraste o `test.zip` para a zona de drop
3. Clique em "Analisar PDFs"
4. Aguarde o processamento (pode levar 10-30 segundos)

### 5. Verificar Resultado Esperado

Como há uma **placa diferente** (ABC-1234 vs ABC-5678), o sistema deverá retornar:

```
⚠️ Divergências Encontradas
Documentos analisados: 2. Divergências encontradas: 1

▼ Divergências Encontradas:

📍 inconsistent_data - placa
   Arquivo 1: seguro1.pdf → ABC-1234
   Arquivo 2: seguro2.pdf → ABC-5678
   "A placa do veículo difere entre os documentos"
```

## Teste com Divergência de CPF

**seguro3.txt** (CPF diferente)
```
SEGURO AUTOMOTIVO

CPF: 123.456.789-00  <-- CPF 1
Nome: João da Silva
...resto igual...
Placa: ABC-1234
```

**seguro4.txt** (CPF diferente)
```
APÓLICE DE SEGURO

CPF: 987.654.321-00  <-- DIVERGÊNCIA: CPF diferente!
Nome: João da Silva
...resto igual...
Placa: ABC-1234
```

Resultado esperado:
```
⚠️ Divergências Encontradas
- type: inconsistent_data
- field: cpf
- value1: 123.456.789-00
- value2: 987.654.321-00
```

## Teste com Campo Faltante

**seguro5.txt** (Sem telefone)
```
CPF: 123.456.789-00
Nome: João
Endereço: Rua X
Telefone: (11) 98765-4321
...
```

**seguro6.txt** (Telefone faltando)
```
CPF: 123.456.789-00
Nome: João
Endereço: Rua X
...  <-- Sem Telefone!
```

Resultado esperado:
```
- type: missing_field
- field: telefone
- description: "Campo obrigatório não encontrado em um ou mais documentos"
```

## API REST - Testes com cURL/Postman

### POST /api/analyze

Enviar um ZIP para análise:

```bash
curl -X POST http://localhost:3001/api/analyze \
  -F "file=@test.zip"
```

Esperado (sucesso):
```json
{
  "success": true,
  "analysisId": "507f1f77bcf86cd799439011",
  "status": "divergencies",
  "message": "Documentos analisados: 2. Divergências encontradas: 1",
  "pdfContents": [...],
  "divergencies": [...],
  "timestamp": "2026-02-10T15:30:00.000Z"
}
```

### GET /api/analyses/:id

Recuperar análise anterior:

```bash
curl http://localhost:3001/api/analyses/507f1f77bcf86cd799439011
```

### GET /api/analyses

Listar histórico com paginação:

```bash
curl "http://localhost:3001/api/analyses?page=1&limit=10"
```

## Cenários de Teste Recomendados

| Cenário | Esperado | Prioridade |
|---------|----------|-----------|
| 1 PDF válido | Status: OK | 🔴 crítica |
| 2 PDFs identicos | Status: OK | 🔴 crítica |
| 2 PDFs com 1 divergência | Status: divergencies + lista | 🔴 crítica |
| PDF com imagens (OCR) | Extração bem-sucedida | 🟡 alta |
| ZIP vazio | Erro com mensagem clara | 🟡 alta |
| ZIP sem PDFs | Erro apropriado | 🟡 alta |
| Arquivo > 50MB | Erro de tamanho | 🟢 média |
| API sem chave OpenAI | Erro claro | 🔴 crítica |

## Troubleshooting de Teste

### Erro: "OPENAI_API_KEY not configured"
**Solução:** Edite `backend/.env` e adicione sua chave da OpenAI

### Erro: "Cannot connect to MongoDB"
**Solução:** Inicie MongoDB: 
- Windows: `mongod`
- Mac/Linux: `brew services start mongodb-community`

### Análise retorna vazio
**Solução:** PDFs podem ser imagens puras sem texto. Certifique-se que:
1. PDFs contêm texto OCR-ável
2. Texto é em português ou inglês (IA treinada nisso)
3. Dados de seguros seguem padrão comum

### Upload travado > 1 minuto
**Solução:** Pode ser:
1. PDF muito grande com muitos dados
2. IA processando (até 30s é normal)
3. API OpenAI lenta
Aguarde até 5 minutos; se ainda travar, reinicie os servidores

## Performance Esperada

- 1 PDF (5 páginas): 5-10 segundos
- 2 PDFs (5 páginas cada): 10-20 segundos
- 5 PDFs (5 páginas cada): 30-45 segundos

*Cada chamada à OpenAI leva ~3-5 segundos*

---

Bom teste! 🚀
