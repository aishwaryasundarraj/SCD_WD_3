(() => {
  const socket = io();
  const WIN_LINES = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  const loginSection = document.getElementById('loginSection');
  const loginForm = document.getElementById('loginForm');
  const aiToggle = document.getElementById('aiToggle');
  const gameSection = document.getElementById('gameSection');
  const boardDiv = document.getElementById('board');
  const statusDiv = document.getElementById('status');
  const restartBtn = document.getElementById('restartBtn');
  const playerInfoDiv = document.getElementById('playerInfo');
  const timerBar = document.getElementById('timerBar');
  const timerCountdown = document.getElementById('timerCountdown');
  const themeToggle = document.getElementById('themeToggle');
  const scoreboardList = document.getElementById('scoreboardList');
  const moveHistoryList = document.getElementById('moveHistoryList');
  const leaderboardList = document.getElementById('leaderboardList');
  const avatarSelect = document.getElementById('avatarSelect');
  const confettiCanvas = document.getElementById('confettiCanvas');
  const confettiCtx = confettiCanvas.getContext('2d');

  // ** Audio elements from HTML **
  const clickSound = document.getElementById('clickSound');
  const winSound = document.getElementById('winSound');
  const drawSound = document.getElementById('drawSound');
  const timeoutSound = document.getElementById('timeoutSound');
  

  let confettiActive = false;

  let gameId = null;
  let playerIndex = null;
  let mySymbol = null;
  let myName = null;
  let myAvatar = null;
  let aiAvatar = null;
  let playVsAI = false;
  let currentTurn = 0;
  let board = Array(9).fill(null);
  let history = [];
  let moveTimerDuration = 30;
  let currentTimerDuration = moveTimerDuration;  // For dynamic timer handling
  let timerInterval = null;
  let timerEndTime = null;
  let darkMode = false;

  // *** Game over flag to prevent moves after game ended ***
  let gameOver = false;

  // Helper to safely play sounds
  function playSound(soundElement) {
    if (!soundElement) return;               // Exit if no audio element provided
    soundElement.currentTime = 0;            // Rewind audio to start so it plays fresh
    soundElement.play().catch(e => {
      // Optionally handle errors here (like autoplay restrictions)
    });
  }

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const nameInput = document.getElementById('playerName');
    const avatar = avatarSelect.value || '❌';
    const name = nameInput.value.trim();
    if (!name) return alert('Please enter your name');

    myName = name;
    myAvatar = avatar;
    mySymbol = avatar;
    playVsAI = aiToggle && aiToggle.checked;
    aiAvatar = myAvatar === "❌" ? "⭕" : "❌";
    loginSection.hidden = true;
    gameSection.hidden = false;
    playerInfoDiv.textContent = `You are ${myName} ${myAvatar}`;
    notifyStatus(playVsAI ? "Your turn (vs AI)" : "Looking for a game...");
    if (playVsAI) {
      startAIGame();
    } else {
      socket.emit('joinGame', { playerName: myName, avatar: myAvatar });
    }
  });

  // Listen for avatarChanged event
  socket.on('avatarChanged', (newAvatar) => {
    alert(`Avatar conflict! Your emoji was changed to ${newAvatar} to avoid duplication.`);
    myAvatar = newAvatar;
    mySymbol = newAvatar;
    playerInfoDiv.textContent = `You are ${myName} ${myAvatar}`;
  });

  restartBtn.addEventListener('click', () => {
    if (playVsAI) {
      startAIGame();
    } else {
      socket.emit('restartGame', gameId);
      resetTimer();
      clearConfetti();
    }
  });

  themeToggle.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('dark', darkMode);
    themeToggle.textContent = darkMode ? '☀️' : '🌙';
    localStorage.setItem('darkMode', darkMode);
  });

  if (localStorage.getItem('darkMode') === 'true') {
    darkMode = true;
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️';
  }

  function notifyStatus(msg) {
    statusDiv.textContent = msg;
  }

  // CLIENT + AI SHARED
  function renderBoard(winLine = null) {
    boardDiv.innerHTML = '';
    board.forEach((cell, idx) => {
      const cellDiv = document.createElement('div');
      cellDiv.className = 'cell' + (winLine && winLine.includes(idx) ? ' win' : '');
      cellDiv.textContent = cell || '';
      if (cell) {
        cellDiv.classList.add('disabled');
      } else if (
        !gameOver &&
        ((playVsAI && currentTurn === 0) ||
          (!playVsAI && currentTurn === playerIndex))
      ) {
        cellDiv.style.cursor = 'pointer';
        cellDiv.addEventListener('click', () => {
          if (
            board[idx] ||
            ((playVsAI && currentTurn !== 0) ||
              (!playVsAI && currentTurn !== playerIndex)) ||
            gameOver
          )
            return;

          playSound(clickSound);  // Play click sound on valid move

          if (playVsAI) {
            board[idx] = myAvatar;
            history.push({ playerName: myName, index: idx });
            currentTurn = 1;
            renderBoard();
            renderHistory();
            const res = checkWinnerAI(board);
            if (res && res.winner) {
              notifyStatus('You win!');
              playSound(winSound);    // Play win sound on player win
              showConfetti();
              renderBoard(res.line);
              restartBtn.style.visibility = 'visible';
              gameOver = true;
            } else if (res && res.draw) {
              notifyStatus("It's a draw!");
              playSound(drawSound);  // Play draw sound
              restartBtn.style.visibility = 'visible';
              gameOver = true;
            } else {
              setTimeout(aiMove, 700);
            }
          } else {
            socket.emit('makeMove', { gameId, index: idx });
          }
        });
      }
      boardDiv.appendChild(cellDiv);
    });
  }

  function renderHistory() {
    moveHistoryList.innerHTML = '';
    history.forEach(({ playerName, index }, i) => {
      const li = document.createElement('li');
      li.textContent = `${i + 1}. ${playerName} → Cell ${index + 1}`;
      moveHistoryList.appendChild(li);
    });
  }

  function updateScoreboard(players) {
    scoreboardList.innerHTML = '';
    players.forEach((p, idx) => {
      const li = document.createElement('li');
      li.textContent = p.name + ` (${p.avatar})`;
      if (
        (!playVsAI && idx === currentTurn) ||
        (playVsAI && ((idx === 0 && currentTurn === 0) || (idx === 1 && currentTurn === 1)))
      )
        li.classList.add('current');
      scoreboardList.appendChild(li);
    });
  }

  function renderLeaderboard(board) {
    leaderboardList.innerHTML = '';
    const sorted = Object.entries(board).sort((a, b) => b[1].wins - a[1].wins);
    sorted.forEach(([name, stats]) => {
      const li = document.createElement('li');
      li.textContent = `${name} - Wins: ${stats.wins}, Losses: ${stats.losses}, Draws: ${stats.draws}`;
      leaderboardList.appendChild(li);
    });
  }

  // --- Timer & Progress Bar Functions ---
  function resetTimer(seconds = moveTimerDuration) {
    currentTimerDuration = seconds;
    clearTimerBar();
    if (timerInterval) clearInterval(timerInterval);
    timerEndTime = Date.now() + seconds * 1000;
    updateTimerBar();
    timerInterval = setInterval(updateTimerBar, 100);
  }

  function updateTimerBar() {
    const remaining = Math.max(0, timerEndTime - Date.now());
    const percent = (remaining / (currentTimerDuration * 1000)) * 100;
    timerBar.style.width = `${percent}%`;
    timerCountdown.textContent = Math.ceil(remaining / 1000);
    if (remaining <= 0) clearTimerBar();
  }

  function clearTimerBar() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerBar.style.width = '0%';
    timerCountdown.textContent = '';
  }

  function showConfetti() {
    if (confettiActive) return;
    confettiActive = true;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    const confettiPieces = [];
    function randomRange(min, max) {
      return Math.random() * (max - min) + min;
    }
    const colors = ['#ffc107', '#ff5722', '#8bc34a', '#03a9f4', '#e91e63'];
    for (let i = 0; i < 150; i++) {
      confettiPieces.push({
        x: randomRange(0, confettiCanvas.width),
        y: randomRange(-confettiCanvas.height, 0),
        size: randomRange(5, 12),
        speed: randomRange(2, 5),
        angle: randomRange(0, 360),
        color: colors[i % colors.length],
        tilt: randomRange(-10, 10)
      });
    }
    function draw() {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiPieces.forEach(p => {
        confettiCtx.fillStyle = p.color;
        confettiCtx.beginPath();
        const x = p.x + p.tilt;
        const y = p.y;
        confettiCtx.moveTo(x, y);
        confettiCtx.lineTo(x + p.size / 2, y + p.size);
        confettiCtx.lineTo(x - p.size / 2, y + p.size);
        confettiCtx.closePath();
        confettiCtx.fill();
        p.y += p.speed;
        p.x += Math.sin((p.angle * Math.PI) / 180) * 0.5;
        p.angle += 1;
        if (p.y > confettiCanvas.height) {
          p.y = randomRange(-confettiCanvas.height, 0);
          p.x = randomRange(0, confettiCanvas.width);
        }
      });
    }
    function loop() {
      if (!confettiActive) return;
      draw();
      requestAnimationFrame(loop);
    }
    loop();
    setTimeout(() => clearConfetti(), 10000);
  }

  function clearConfetti() {
    confettiActive = false;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  }

  // ---- Socket.IO Events ----

  socket.on('gameJoined', ({ gameId: gid, playerIndex: idx }) => {
    gameId = gid;
    playerIndex = idx;
    mySymbol = myAvatar;
    notifyStatus('Waiting for opponent to join...');
  });

  socket.on('waitingForOpponent', () => {
    notifyStatus('Waiting for opponent to join...');
  });

  socket.on('updatePlayers', (players) => {
    updateScoreboard(players);
  });

  socket.on('start', (data) => {
    currentTurn = data.turn;
    board.fill(null);
    history = [];
    gameOver = false;
    renderBoard();
    renderHistory();
    notifyStatus(currentTurn === playerIndex ? 'Your turn' : "Opponent's turn");
    resetTimer();
  });

  socket.on('gameUpdate', (data) => {
    board = data.board;
    currentTurn = data.turn;
    history = data.history;

    renderBoard(data.line);
    renderHistory();

    const winnerName = data.winner;
    if (winnerName) {
      notifyStatus(winnerName === myName ? 'You win!' : `${winnerName} wins!`);
      playSound(winSound);  // Play win sound on multiplayer win
      showConfetti();
      renderBoard(data.line);
      restartBtn.style.visibility = 'visible';
      speak(winnerName === myName ? 'You win!' : `${winnerName} wins!`);
      gameOver = true;
    } else if (data.draw) {
      notifyStatus("It's a draw!");
      playSound(drawSound); // Play draw sound
      restartBtn.style.visibility = 'visible';
      clearConfetti();
      speak("It's a draw!");
      gameOver = true;
    } else {
      notifyStatus(currentTurn === playerIndex ? 'Your turn' : "Opponent's turn");
      restartBtn.style.visibility = 'hidden';
      clearConfetti();
      if (data.reason === 'timeout') {
        notifyStatus(winnerName === myName ? 'You win! Opponent timed out.' : 'You lost! Timeout.');
        playSound(timeoutSound);  // Play timeout sound
        speak(winnerName === myName ? 'You win! Opponent timed out.' : 'You lost! Timeout.');
      }
      gameOver = false;
    }
    updateScoreboard(data.players);
    resetTimer(data.timerSeconds);
  });

  socket.on('gameRestarted', (data) => {
    board = data.board;
    history = [];
    currentTurn = data.turn;
    gameOver = false;
    renderBoard();
    renderHistory();
    notifyStatus(currentTurn === playerIndex ? 'Your turn' : "Opponent's turn");
    restartBtn.style.visibility = 'hidden';
    resetTimer(data.timerSeconds);
    clearConfetti();
  });

  socket.on('playerLeft', () => {
    notifyStatus('Opponent disconnected. Game ended.');
    restartBtn.style.visibility = 'visible';
    clearTimerBar();
    clearConfetti();
    gameOver = true;
  });

  socket.on('timerStart', (seconds) => {
    resetTimer(seconds);
  });

  socket.on('leaderboardData', renderLeaderboard);

  setTimeout(() => {
    socket.emit('getLeaderboard');
  }, 3000);

  // ------ AI Game Logic functions ------

  function startAIGame() {
    board = Array(9).fill(null);
    history = [];
    currentTurn = 0;
    gameOver = false;
    renderBoard();
    renderHistory();
    notifyStatus('Your turn! (You vs AI)');
    restartBtn.style.visibility = 'hidden';
    clearConfetti();
  }

  function checkWinnerAI(brd) {
    for (const [a, b, c] of WIN_LINES) {
      if (brd[a] && brd[a] === brd[b] && brd[a] === brd[c]) {
        return { winner: brd[a], line: [a, b, c] };
      }
    }
    if (brd.every(Boolean)) {
      return { winner: null, draw: true };
    }
    return null;
  }
function aiMove() {
  if (gameOver) return;

  // Find available spots
  let open = board.map((v, i) => (v === null ? i : null)).filter(i => i !== null);
  if (open.length === 0) return;

  // Check if AI can win in next move
  for (let idx of open) {
    let boardCopy = [...board];
    boardCopy[idx] = aiAvatar;
    const res = checkWinnerAI(boardCopy);
    if (res && res.winner === aiAvatar) {
      makeAIMove(idx);
      return;
    }
  }

  // Check if player can win in next move, block it
  for (let idx of open) {
    let boardCopy = [...board];
    boardCopy[idx] = myAvatar;
    const res = checkWinnerAI(boardCopy);
    if (res && res.winner === myAvatar) {
      makeAIMove(idx);
      return;
    }
  }

  // Take center if free
  if (board[4] === null) {
    makeAIMove(4);
    return;
  }

  // Take one of the corners if free
  const corners = [0, 2, 6, 8];
  const openCorners = corners.filter(i => board[i] === null);
  if (openCorners.length > 0) {
    makeAIMove(openCorners[Math.floor(Math.random() * openCorners.length)]);
    return;
  }

  // Otherwise take any available side
  makeAIMove(open[Math.floor(Math.random() * open.length)]);
}

function makeAIMove(index) {
  board[index] = aiAvatar;
  history.push({ playerName: "AI", index: index });
  currentTurn = 0;
  renderBoard();
  renderHistory();
  const res = checkWinnerAI(board);
  if (res && res.winner) {
    notifyStatus('AI wins!');
    playSound(winSound);
    showConfetti();
    renderBoard(res.line);
    restartBtn.style.visibility = 'visible';
    gameOver = true;
  } else if (res && res.draw) {
    notifyStatus("It's a draw!");
    playSound(drawSound);
    restartBtn.style.visibility = 'visible';
    gameOver = true;
  } else {
    gameOver = false;
  }
}

})();
