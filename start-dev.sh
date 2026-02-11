#!/bin/bash

echo "========================================"
echo "Validador de PDFs de Seguros"
echo "========================================"
echo ""
echo "Iniciando ambientes de desenvolvimento..."
echo ""

# Check and install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "[1/4] Instalando dependências do backend..."
    cd backend
    npm install
    cd ..
fi

# Check and install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "[2/4] Instalando dependências do frontend..."
    cd frontend
    npm install
    cd ..
fi

echo "[3/4] Iniciando Backend (port 3001)..."
echo "[4/4] Iniciando Frontend (port 5173)..."
echo ""
echo "========================================"
echo "IMPORTANTE: Configure o arquivo .env"
echo "========================================"
echo "Edite: backend/.env"
echo "Adicione sua chave da OpenAI: OPENAI_API_KEY=xxx"
echo "Verifique se MongoDB está rodando"
echo ""

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment before starting frontend
sleep 2

# Start frontend in background
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ Backend iniciado (PID: $BACKEND_PID)"
echo "✓ Frontend iniciado (PID: $FRONTEND_PID)"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:3001/api"
echo ""
echo "Pressione Ctrl+C para parar ambos os servidores"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
