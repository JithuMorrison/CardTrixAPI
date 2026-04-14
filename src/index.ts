// ==========================================
// SERVER ENTRY POINT
// Primal Duels: Strategy Arena
// ==========================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socket/socketHandler.js';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', game: 'Primal Duels: Strategy Arena', uptime: process.uptime() });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingInterval: 10000,
  pingTimeout: 5000,
});

setupSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log('');
  console.log('🐾  ═══════════════════════════════════════════════ 🐾');
  console.log('    PRIMAL DUELS: STRATEGY ARENA — Game Server');
  console.log(`    Running on port ${PORT}`);
  console.log('    "Strategy wins. Not luck."');
  console.log('🐾  ═══════════════════════════════════════════════ 🐾');
  console.log('');
});
