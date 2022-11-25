const { Deck } = require('./cards');

class Game {
  constructor() {
    //dictionary mapping name to player
    this.players = {};
    this.joiningPlayers = [];
    //dictionary mapping name to hand
    this.hands = {};
    this.table = [];
    this.handRanks = {};
    this.startingTurn = null;
    this.turn = null;
    this.turnArray = null;
    this.turnLooped = false;
    this.roundPlaying = false;
    this.gameStarted = false;
    this.gameStage = 0;
    this.winner = null;
  }

  addPlayer(playerName) {
    //fix
    if (!this.roundPlaying) {
      this.players[playerName] = {
        money: 1000,
        bid: 0,
        folded: false,
      };
    } else {
      this.joiningPlayers.push(playerName);
    }
  }

  doAction(playerName, action) {
    let originalBid = this.players[playerName].bid;
    let playerArray = Object.values(this.players);

    if (action.type == 'fold') {
      this.players[playerName].folded = true;
    } else if (action.type == 'call') {
      this.players[playerName].bid = Math.max(
        ...playerArray.map((player) => player.bid)
      );

      this.players[playerName].money -=
        this.players[playerName].bid - originalBid;
    } else if (action.type == 'raise') {
      let amount = action.amount;
      this.players[playerName].bid =
        Math.max(...playerArray.map((player) => player.bid)) + amount;

      this.players[playerName].money -=
        this.players[playerName].bid - originalBid;
    }

    //turn is next
    this.nextTurn();
  }

  newRound() {
    //add joining players
    for (const player of this.joiningPlayers) {
      this.addPlayer(player);
    }
    this.joiningPlayers = [];

    this.roundPlaying = true;
    //reset bids and folds
    console.log(this.players);
    for (const [key, value] of Object.entries(this.players)) {
      value.folded = false;
      value.bid = 0;
    }

    this.hands = {};
    this.table = [];
    this.handRanks = {};
    this.gameStage = 0;
    this.winner = null;

    //fix turn and turnArray because it is null now
    this.turnArray = Object.keys(this.players);
    this.startingTurn = 0;
    this.turn = 0;
    this.turnLooped = false;

    //shuffle and deal
    let deck = new Deck();
    deck.shuffleDeck();

    //TODO check if player has money
    for (const [key, value] of Object.entries(this.players)) {
      this.hands[key] = deck.deal(2);
    }

    //deal table
    this.table = deck.deal(5);
  }

  nextTurn() {
    console.log(this.roundPlaying);
    let stillPlaying = Object.values(this.players).filter((player) => {
      return player.folded == false;
    });

    //check winner
    if (stillPlaying.length == 1) {
      this.getWinner();
    }

    do {
      this.turn = (this.turn += 1) % this.turnArray.length;
    } while (this.players[this.turnArray[this.turn]].folded == true);

    //check turn looped
    if (this.turn == this.startingTurn) this.turnLooped = true;

    //check next stage
    if (this.turnLooped && this.allCalled(stillPlaying)) {
      this.turnLooped = false;
      this.startingTurn = this.turn;
      this.gameStage += 1;
    }

    if (this.gameStage == 4) {
      this.getWinner();
    }
  }

  allCalled(stillPlaying) {
    let bid = stillPlaying[0].bid;

    for (const player of stillPlaying) {
      if (bid != player.bid) {
        return false;
      }
    }
    return true;
  }

  getWinner() {
    //array of player names playing
    let playersPlaying = Object.keys(this.players).filter((player) => {
      return this.players[player].folded == false;
    });

    //get ranks of each person
    console.log('get winner');
    for (const player of playersPlaying) {
      this.handRanks[player] = Deck.getBestRank(this.hands[player], this.table);
    }

    //who won
    let winner = playersPlaying[0];

    for (const player of playersPlaying) {
      if (
        Deck.firstRankHigher(this.handRanks[winner], this.handRanks[player])
      ) {
        winner = player;
      }
    }

    console.log(this.handRanks);
    console.log(winner);

    //give money
    for (const [key, value] of Object.entries(this.players)) {
      this.players[winner].money += value.bid;
    }

    this.winner = winner;

    this.roundPlaying = false;
    //new round
  }

  getObj() {
    let table;
    if (this.gameStage == 0) {
      //first stage
      table = this.table.slice(0, 0);
    } else if (this.gameStage == 1) {
      //flop
      table = this.table.slice(0, 3);
    } else if (this.gameStage == 2) {
      //turn
      table = this.table.slice(0, 4);
    } else {
      //river
      table = this.table.slice(0, 5);
    }

    return {
      players: this.players,
      hands: this.hands,
      table: table,
      startingTurn: this.startingTurn,
      turn: this.turn,
      turnArray: this.turnArray,
      turnLooped: this.turnLooped,
      roundPlaying: this.roundPlaying,
      gameStarted: this.gameStarted,
      gameStage: this.gameStage,
    };
  }
}

function initGame(firstPlayerName) {
  let game = new Game();
  game.addPlayer(firstPlayerName);
  return game;
}

module.exports = {
  Game,
  initGame,
};
