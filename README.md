# Tic Tac Toe 🎮

A modern, feature-rich Tic Tac Toe web app with multiplayer and AI modes, built with Node.js, Socket.IO, and vanilla JavaScript.

Summarized Features

🎮 Real-time Multiplayer: Play with anyone online, synchronized instantly

🤖 Play vs AI: Challenge a computer opponent with random moves

😃 Avatar Selection: Choose your unique emoji avatar

⏱️ Timer & Timeout: Each move is timed, with clear visual feedback

🔊 Sound Effects: Hear satisfying sounds for moves, wins, draws, and timeouts

🎉 Confetti Animation: Celebrate victories with animated confetti

🗣️ Voice Feedback: Announcements for wins, losses, and draws via speech synthesis

🌑 Light/Dark Mode: Toggle between day and night themes

🏆 Leaderboard & Scores: Track top players and personal performance

📱 Responsive Design: Enjoy smooth gameplay on mobile and desktop


## Demo

Try the live demo here 
(https://scd-wd-3.onrender.com/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v12 or higher recommended)
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. Clone the repo:
2. Install dependencies:
3. Run the server:
4. Open your browser and visit:http://localhost:3000
## Project Structure

- `/public` — Static files served by the server  
  - `index.html` — Main HTML file  
  - `client.js` — Client-side JavaScript with game logic and Socket.IO client  
  - `style.css` — Stylesheet  
  - `/sounds` — Audio effects files (mp3)  
- `server.js` — Node.js/Express server with Socket.IO backend

## How to Play

- Enter your name and choose an avatar.  
- Decide to play against another player online or vs AI.  
- Take turns clicking empty cells to place your avatar.  
- Try to match three in a row horizontally, vertically, or diagonally.  
- The game stops when a player wins or the board fills (draw).  
- Use the restart button to start a new game.  
- Enjoy sound effects and animations on key events.

## Customization

- Change or add avatars in the avatar selection dropdown in `index.html`.  
- Replace sound effect files in `public/sounds/` with your own `.mp3` files.  
- Modify colors and layout in `style.css`.

## Credits

- Developed by Aishwarya.S.  
- Using [Socket.IO](https://socket.io/) for real-time communication  
- Confetti animation inspired by open-source scripts  
- Sound effects sourced from free sound libraries or created independently

  ## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



Feel free to open issues for bugs or feature requests, or submit pull requests!

Happy gaming! 🎉
