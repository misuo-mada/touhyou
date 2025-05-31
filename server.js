
// server.js - Node.js + Socket.IO サーバー
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let players = {}; // { socketId: { name, role, avatar, voted } }
let voteCounts = {}; // { "田中さん": 2, ... }
let totalVoters = 0;

io.on('connection', (socket) => {
  console.log(`🟢 ${socket.id} connected`);

  socket.on('register', ({ name, role, avatar }) => {
    players[socket.id] = { name, role, avatar, voted: false };
    totalVoters = Object.keys(players).length;
  });

  socket.on('vote', (target) => {
    if (!players[socket.id]?.voted) {
      voteCounts[target] = (voteCounts[target] || 0) + 1;
      players[socket.id].voted = true;
      io.emit('voteUpdate', voteCounts);

      const votedCount = Object.values(players).filter(p => p.voted).length;
      if (votedCount === totalVoters) {
        io.emit('showResult', voteCounts);
      }
    }
  });

  socket.on('startVote', () => {
    voteCounts = {}; // リセット
    for (const id in players) players[id].voted = false;
    io.emit('voteStarted');
  });

  socket.on('forceEnd', () => {
    io.emit('showResult', voteCounts);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 ${socket.id} disconnected`);
    delete players[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});