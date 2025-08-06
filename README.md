# Tic Tac Toe 🎮

A modern, feature-rich Tic Tac Toe web app with multiplayer and AI modes, built with Node.js, Socket.IO, and vanilla JavaScript.

![Demo screenshot](screenshot.png) <!-- Add your screenshot here -->

## Features

- **Multiplayer mode** via WebSocket (Socket.IO)
- Play **against AI** with a simple random move opponent
- Prevents moves after win/draw — game properly ends
- Move timer with a progress bar and timeout handling
- Customizable player avatar emojis
- Confetti animation celebration on win
- Voice feedback using Web Speech API
- Audio sound effects for moves, wins, draws, and timeouts
- Dark mode toggle
- Move history and leaderboard display
- Responsive design with accessibility support

## Demo

Try the live demo here (add your deployed URL if you have one)  
`https://yourdomain.com`

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
