const io = require('socket.io')({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const { Game, initGame } = require('./game');

const { makeid } = require('./utils');

//socketroom is a dictionary that maps socket id to room names
const socketRooms = {};

/*
game is a dictionary with the keys as the roomNumbers
    players: {},
    hands: {},
    table: [],
    startingTurn: null,
    turn: null,
    turnArray: null,
    roundPlaying: false,
    gameStarted: false,
    gameStage: 0,
*/
const game = {};

io.on('connect', (socket) => {
  socket.on('actionDone', handleAction);
  socket.on('newRound', handleNewRound);
  socket.on('newGame', handleNewGame);
  socket.on('joinGame', handleJoinGame);
  socket.on('disconnect', handleDisconnect);

  function handleAction(action) {
    const roomCode = socketRooms[socket.id];
    let gameInstance = game[roomCode];

    //action of person not in game
    if (!roomCode) return;

    //game not started
    if (!gameInstance.gameStarted) return;

    //game just finished
    if (gameInstance.gameStage == 4) return;

    //not person's turn
    if (gameInstance.turnArray[gameInstance.turn] != socket.playerName) {
      return;
    }

    //TODO handle action then move next round
    gameInstance.doAction(socket.playerName, action);

    emitGameState(roomCode, gameInstance);

    //game ended
    if (gameInstance.gameStage == 4 || !gameInstance.roundPlaying) {
      //emit game state to show remaining cards
      gameInstance.gameStage = 4;
      emitGameState(roomCode, gameInstance)

      emitWinner(roomCode, {
        winners: gameInstance.winners,
        handRanks: gameInstance.handRanks,
      });
    }
  }

  //another hand is dealt
  function handleNewRound() {
    const roomCode = socketRooms[socket.id];

    game[roomCode].newRound();

    emitGameState(roomCode, game[roomCode]);
  }

  function handleNewGame(firstPlayerName) {
    let roomCode = makeid(5);
    socketRooms[socket.id] = roomCode;
    socket.emit('gameCode', roomCode);

    socket.join(roomCode);
    socket.playerName = firstPlayerName;
    socket.emit('init');
    startNewGame(roomCode, firstPlayerName);
  }

  function startNewGame(roomCode, firstPlayerName) {
    //game stuff for easy use
    game[roomCode] = initGame(firstPlayerName);
    game[roomCode].gameStarted = true;
  }

  function handleJoinGame({ roomCode, playerName }) {
    if (!roomCode) {
      socket.emit('unknownCode');
      return;
    }
    //room is a set
    const room = io.sockets.adapter.rooms.get(roomCode);

    //get the size of the room if it exists
    let numsockets;
    if (room) {
      numsockets = room.size;
    }

    if (!room || numsockets === 0) {
      socket.emit('unknownCode');
      return;
    } else if (
      Object.keys(game[roomCode].players).includes(playerName) ||
      Object.keys(game[roomCode].joiningPlayers).includes(playerName)
    ) {
      socket.emit('sameName');
      return;
    }

    socketRooms[socket.id] = roomCode;
    socket.join(roomCode);

    //add the players to the state object
    game[roomCode].addPlayer(playerName);

    socket.playerName = playerName;
    socket.emit('gameCode', roomCode);

    if (game[roomCode].roundPlaying) emitGameState(roomCode, game[roomCode]);
  }

  function handleDisconnect() {
    let roomCode = socketRooms[socket.id];
    if (!roomCode) return;

    //leave player from game
    delete socketRooms[socket.id];
    let playerName = socket.playerName;
    //delete state players and game players
    delete game[roomCode].players[playerName];

    //if no one in room
    if (!io.sockets.adapter.rooms.get(roomCode)) {
      delete game[roomCode];
    }
  }
});

function emitGameState(roomCode, gameInstance) {
  //TODO gameObj to state

  io.sockets.in(roomCode).emit('gameState', gameInstance.getObj());
}

function emitWinner(roomCode, obj) {
  io.sockets.in(roomCode).emit('winner', obj);
}

io.listen(process.env.PORT || 4400);
