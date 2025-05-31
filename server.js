
// server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let players = {}; // socketId: { name, role, avatar, voted }
let voteCounts = {}; // { name: count }
let voteTargets = [];

io.on('connection', (socket) => {
  console.log(`🟢 ${socket.id} connected`);

  socket.on('register', ({ name, role, avatar }) => {
    players[socket.id] = { name, role, avatar, voted: false };
  });

  socket.on('startVote', (targets) => {
    voteTargets = targets;
    voteCounts = {};
    for (const id in players) players[id].voted = false;
    io.emit('voteStarted', voteTargets);
  });

  socket.on('vote', (target) => {
    if (!players[socket.id]?.voted && voteTargets.includes(target)) {
      voteCounts[target] = (voteCounts[target] || 0) + 1;
      players[socket.id].voted = true;

      const votedCount = Object.values(players).filter(p => p.voted).length;
      const total = Object.keys(players).length;

      if (votedCount === total) {
        io.emit('showResult', voteCounts);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔴 ${socket.id} disconnected`);
    delete players[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
