# Friend Suggestion Project

A modern web application for social network analysis using Graph Data Structures (BFS, DFS, and Mutual Friend Suggestions).

## Project Structure (Clean)
- `index.html`: Frontend structure
- `style.css`: Modern UI styling
- `script.js`: Interactive graph logic and API calls
- `server.js`: Express backend (serves files & executes C logic)
- `main.c`: C program for graph traversal algorithms
- `graphdata.json`: Persisted graph state
- `package.json`: Project configuration

## Prerequisites
- **Node.js**: Installed and in PATH
- **GCC (MinGW/Cygwin)**: Required to compile the C program

## Setup and Run
1. Open the project folder in VS Code.
2. Open a terminal and run:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open your browser at [http://localhost:5000](http://localhost:5000)

## Features
- **Graph Visualization**: Interactive canvas showing your social network.
- **BFS/DFS**: Traversal paths calculated in real-time.
- **Smart Suggestions**: Suggests new friends based on mutual connections.
- **Auto-Compilation**: The server will attempt to compile `main.c` automatically if `main.exe` is missing.
