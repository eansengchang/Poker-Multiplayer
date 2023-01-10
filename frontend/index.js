const socket = io.connect('localhost:4400');

socket.on('gameState', handleGameState);
socket.on('winner', handleWinner);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownGame);
socket.on('sameName', handleSameName);

const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const startRoundBut = document.getElementById('startRoundBut');
const newRoundDiv = document.getElementById('newRoundDiv');
const infoList = document.getElementById('infoList');
const winnerInfo = document.getElementById('winnerInfo');

const foldBut = document.getElementById('foldBut');
const raiseBut = document.getElementById('raiseBut');
const callBut = document.getElementById('callBut');
const raiseAmmountInput = document.getElementById('raiseAmmountInput');

const gameUI = document.getElementById('gameUI');
const newGameBut = document.getElementById('newGameButton');
const joinGameBut = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const nameInput = document.getElementById('nameInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');

let playerName;
let currentGameState;

const rankToName = {
  1: 'Royal Flush',
  2: 'Straight Flush',
  3: 'Four of a Kind',
  4: 'Full House',
  5: 'Flush',
  6: 'Straight',
  7: 'Three of a Kind',
  8: 'Two Pair',
  9: 'Pair',
  10: 'High Card',
};

function setup() {
  raiseAmmountInput.value = 5;

  newGameBut.addEventListener('click', newGame);
  joinGameBut.addEventListener('click', joinGame);
  startRoundBut.addEventListener('click', startRound);
  foldBut.addEventListener('click', foldButPressed);
  raiseBut.addEventListener('click', raiseButPressed);
  callBut.addEventListener('click', callButPressed);

  function foldButPressed() {
    socket.emit('actionDone', { type: 'fold' });
  }

  function raiseButPressed() {
    socket.emit('actionDone', {
      type: 'raise',
      amount: parseInt(raiseAmmountInput.value),
    });
  }

  function callButPressed() {
    socket.emit('actionDone', { type: 'call' });
  }

  function newGame() {
    if (nameInput.value === '') return alert('Please enter a name');
    playerName = nameInput.value;
    socket.emit('newGame', nameInput.value);
    init();
  }

  function joinGame() {
    if (nameInput.value === '') return alert('Please enter a name');
    const roomCode = gameCodeInput.value;
    playerName = nameInput.value;

    socket.emit('joinGame', { roomCode, playerName });
    init();
  }

  function startRound() {
    socket.emit('newRound');
  }
}

function init() {
  initialScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  gameUI.style.display = 'none';
  document.body.style.background = '#81d0ef';
}

function keyPressed() {
  socket.emit('keyDown', keyCode);
}

function keyReleased() {
  socket.emit('keyUp', keyCode);
}

function handleGameState(gameState) {
  currentGameState = gameState;
  console.log(gameState);

  let playerList = '';

  for (const [key, value] of Object.entries(gameState.players)) {
    playerList += `${key} has $${value.money} and has bid ${value.bid} <br>`;
  }

  const pot = Object.values(gameState.players).reduce((accumulator, object) => {
    return accumulator + object.bid;
  }, 0);

  infoList.innerHTML = `Your name: ${playerName} <br>
                        Pot: ${pot} <br>
                        Turn: ${gameState.turnArray[gameState.turn]} <br>
                        Your cards: ${gameState.hands[playerName]} <br>
                        Table cards: ${gameState.table} <br>
                        ${playerList}
  `;

  if (!Object.keys(gameState.players).includes(playerName)) {
    infoList.innerHTML = 'You will join the game after the round ends.';
  }

  if (gameState.roundPlaying) {
    newRoundDiv.style.display = 'none';
    gameUI.style.display = 'flex';
  } else {
    newRoundDiv.style.display = 'block';
  }

  if (gameState.gameStage != 4) {
    winnerInfo.innerHTML = '';
  }
}

function handleWinner(obj) {
  console.log(obj);
  let { winners, handRanks } = obj;

  console.log(currentGameState);
  let winnerTxt = winners.map(
    (winner) => `<br> Winner: ${winner} <br>
  Hand: ${currentGameState.hands[winner]} with a ${
      rankToName[handRanks[winner].rank]
    }`
  );

  winnerInfo.innerHTML = winnerTxt;
}

function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode;
}

function handleUnknownGame() {
  reset();
  alert('unknown game code!');
}

function handleSameName() {
  reset();
  alert('This name is already taken!');
}

function reset() {
  gameCodeInput.value = '';
  gameCodeDisplay.innerText = '';
  initialScreen.style.display = 'block';
  gameScreen.style.display = 'none';
  document.body.style.background = 'white';
}
