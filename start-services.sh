

echo " Iniciando servicios de Banorte Open Innovation..."


cleanup() {
    echo "🧹 Limpiando procesos..."
    pkill -f "tsx watch src/index.ts"
    pkill -f "next dev"
    exit 0
}

# Registrar función de limpieza
trap cleanup SIGINT SIGTERM

# Iniciar MCP Server
echo "Iniciando MCP Server..."
cd mcp-server
npm run watch &
MCP_PID=$!
cd ..

# Esperar un momento para que el MCP server se inicie
sleep 3

# Iniciar Frontend
echo " Iniciando Frontend Next.js..."
npm run dev &
FRONTEND_PID=$!

echo "Servicios iniciados:"
echo "  MCP Server: PID $MCP_PID"
echo "  Frontend: http://localhost:3000 (PID $FRONTEND_PID)"
echo ""
echo " Para detener ambos servicios, presiona Ctrl+C"
echo ""

# Esperar que ambos procesos terminen
wait $MCP_PID $FRONTEND_PID