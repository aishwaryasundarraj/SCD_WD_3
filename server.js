const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let games = {};
let leaderBoard = {};

function createGame() {
  return {
    board: Array(9).fill(null),
    players: [],
    turn: 0,
    winner: null,
    draw: false,
    history: [],
    timer: null,
    roundStartTimestamp: Date.now()
  };
}

function updateLeaderBoard(name, result) {
  if (!name) return;
  if (!leaderBoard[name]) leaderBoard[name] = { wins: 0, losses: 0, draws: 0 };
  if (result === 'win') leaderBoard[name].wins++;
  else if (result === 'loss') leaderBoard[name].losses++;
  else if (result === 'draw') leaderBoard[name].draws++;
}

io.on('connection', (socket) => {
  let gameId = null;
  let playerIdx = null;

  socket.on('joinGame', ({ playerName, avatar }) => {
    

    for (let id in games) {
      if (games[id].players.length < 2) {
        const firstPlayerAvatar = games[id].players[0].avatar;
        let assignedAvatar = avatar;
        if (avatar === firstPlayerAvatar) {
          const fallbackAvatars = ["❌", "⭕", "🐱", "🐶", "🐸", "🌟", "🍎"];
          assignedAvatar = fallbackAvatars.find(a => a !== firstPlayerAvatar) || "⭕";
          socket.emit('avatarChanged', assignedAvatar);
        }
        gameId = id;
        playerIdx = 1;
        games[id].players.push({ id: socket.id, name: playerName, avatar: assignedAvatar });
        break;
      }
    }
    if (!gameId) {
      gameId = socket.id;
      playerIdx = 0;
      games[gameId] = createGame();
      games[gameId].players.push({ id: socket.id, name: playerName, avatar });
    }
    socket.join(gameId);

    socket.emit('gameJoined', { gameId, playerIndex: playerIdx });
    io.to(gameId).emit('updatePlayers', games[gameId].players.map(p => ({ name: p.name, avatar: p.avatar })));

    if (games[gameId].players.length === 2) {
      startGameWithTimer(gameId);
    } else {
      socket.emit('waitingForOpponent');
    }
  });

  socket.on('makeMove', ({ gameId: gid, index }) => {
    const game = games[gid];
    if (!game || game.winner || game.draw) return;

    if (game.players[game.turn].id !== socket.id) return;
    if (game.board[index]) return;

    const player = game.players[game.turn];
    game.board[index] = player.avatar || (game.turn === 0 ? 'X' : 'O');
    game.history.push({ playerName: player.name, index });

    if (game.timer) {
      clearTimeout(game.timer);
      game.timer = null;
    }

    let winLine = null;
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
        game.winner = player.name;
        winLine = line;
        updateLeaderBoard(player.name, 'win');
        updateLeaderBoard(game.players[1 - game.turn].name, 'loss');
        break;
      }
    }

    if (!game.winner && game.board.every(Boolean)) {
      game.draw = true;
      updateLeaderBoard(game.players[0].name, 'draw');
      updateLeaderBoard(game.players[1].name, 'draw');
    }

    io.to(gid).emit('gameUpdate', {
      board: game.board,
      turn: 1 - game.turn,
      winner: game.winner,
      draw: game.draw,
      line: winLine,
      history: game.history,
      players: game.players.map(p => ({ name: p.name, avatar: p.avatar })),
      timerSeconds: 30
    });

    if (!game.winner && !game.draw) {
      game.turn = 1 - game.turn;
      startGameWithTimer(gid);
    }
  });

  socket.on('disconnect', () => {
    if (!gameId) return;
    const game = games[gameId];
    if (!game) return;
    io.to(gameId).emit('playerLeft');
    if (game.timer) {
      clearTimeout(game.timer);
      game.timer = null;
    }
    delete games[gameId];
  });

  
  socket.on('restartGame', (gid) => {
    
    const game = games[gid];
    if (!game) return;
    if (game.timer) {
      clearTimeout(game.timer);
      game.timer = null;
    }
    game.board.fill(null);
    game.turn = 0;
    game.winner = null;
    game.draw = false;
    game.history = [];
    game.roundStartTimestamp = Date.now();

    io.to(gid).emit('gameRestarted', {
      board: game.board,
      turn: game.turn,
      players: game.players.map(p => ({ name: p.name, avatar: p.avatar })),
      timerSeconds: 30
    });
    startGameWithTimer(gid);
  });

  function startGameWithTimer(gid) {
    const game = games[gid];
    if (!game) return;
    if (game.timer) clearTimeout(game.timer);
    io.to(gid).emit('timerStart', 30);
    game.timer = setTimeout(() => {
      game.winner = game.players[1 - game.turn].name;
      updateLeaderBoard(game.winner, 'win');
      updateLeaderBoard(game.players[game.turn].name, 'loss');
      io.to(gid).emit('gameUpdate', {
        board: game.board,
        turn: game.turn,
        winner: game.winner,
        draw: false,
        line: null,
        history: game.history,
        players: game.players.map(p => ({ name: p.name, avatar: p.avatar })),
        timerSeconds: 0,
        reason: 'timeout'
      });
    }, 30000);
  }

  socket.on('getLeaderboard', () => {
    socket.emit('leaderboardData', leaderBoard);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
