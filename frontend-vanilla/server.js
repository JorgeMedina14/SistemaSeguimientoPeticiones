const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Servir archivos estáticos
app.use(express.static(__dirname));

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   ✅ Servidor Frontend corriendo                  ║
║   📍 http://localhost:${PORT}                      ║
║   🏛️  Sistema de Peticiones - Vanilla JS          ║
╚════════════════════════════════════════════════════╝
  `);
});
