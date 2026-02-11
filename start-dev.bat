@echo off
echo ========================================
echo Validador de PDFs de Seguros
echo ========================================
echo.
echo Iniciando ambientes de desenvolvimento...
echo.

REM Check if node_modules exist
if not exist "backend\node_modules" (
    echo [1/4] Instalando dependencias do backend...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo [2/4] Instalando dependencias do frontend...
    cd frontend
    call npm install
    cd ..
)

echo [3/4] Iniciando Backend (port 3001)...
echo [4/4] Iniciando Frontend (port 5173)...
echo.
echo ========================================
echo IMPORTANTE: Configure o arquivo .env
echo ========================================
echo Edite: backend\.env
echo Adicione sua chave da OpenAI: OPENAI_API_KEY=xxx
echo Verifique se MongoDB esta rodando
echo.

REM Start backend in new window
start cmd /k "cd backend && npm run dev"

REM Wait a moment before starting frontend
timeout /t 3 /nobreak

REM Start frontend in new window
start cmd /k "cd frontend && npm run dev"

echo.
echo Abas de terminal abertas para Backend e Frontend
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:3001/api
echo.
pause
