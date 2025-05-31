import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let voteCounts = {};
let voteTargets = [];
let votedClients = new Set();

io.on('connection', (socket) => {
  console.log(`🟢 ${socket.id} connected`);

  socket.on('startVote', ({ targets, limit }) => {
    voteTargets = targets;
    voteCounts = {};
    votedClients.clear();

    const totalClients = io.engine.clientsCount;

    io.emit('voteStarted', {
      targets: voteTargets,
      limit,
      total: totalClients
    });
  });

  socket.on('vote', (target) => {
    if (!votedClients.has(socket.id) && voteTargets.includes(target)) {
      voteCounts[target] = (voteCounts[target] || 0) + 1;
      votedClients.add(socket.id);

      const voted = votedClients.size;
      const total = io.engine.clientsCount;
      io.emit('voteProgress', { voted, total });

      // 自動的に全員投票完了したら送信
      if (voted === total) {
        io.emit('showResult', voteCounts);
      }
    }
  });

  socket.on('requestResult', () => {
    io.emit('showResult', voteCounts);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 ${socket.id} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
