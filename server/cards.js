function getCombinations(cards) {
  var result = [];
  var f = function (prefix, cards) {
    for (var i = 0; i < cards.length; i++) {
      result.push([...prefix, cards[i]]);
      f([...prefix, cards[i]], cards.slice(i + 1));
    }
  };
  f([], cards);
  return result;
}

const suits = ['D', 'C', 'H', 'S'];
const numbers1 = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
];
const numbers2 = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];

function compare1(card1, card2) {
  // cards are like "10H", "KS", "AC", "1D"
  let numRank1 = numbers1.indexOf(card1.slice(0, -1));
  let numRank2 = numbers1.indexOf(card2.slice(0, -1));
  if (numRank1 != numRank2) return numRank1 - numRank2;

  let suit1 = card1.slice(-1);
  let suit2 = card2.slice(-1);
  return suits.indexOf(suit1) - suits.indexOf(suit2);
}
function compare2(card1, card2) {
  // cards are like "10H", "KS", "AC", "1D"
  let numRank1 = numbers2.indexOf(card1.slice(0, -1));
  let numRank2 = numbers2.indexOf(card2.slice(0, -1));
  if (numRank1 != numRank2) return numRank1 - numRank2;

  let suit1 = card1.slice(-1);
  let suit2 = card2.slice(-1);
  return suits.indexOf(suit1) - suits.indexOf(suit2);
}

class Deck {
  constructor() {
    let deck = [];
    for (let number of numbers1) {
      for (let suit of suits) {
        deck.push(`${number}${suit}`);
      }
    }
    this.deck = deck;
  }

  /* Randomize array in-place using Durstenfeld shuffle algorithm */
  shuffleDeck() {
    for (var i = this.deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = this.deck[i];
      this.deck[i] = this.deck[j];
      this.deck[j] = temp;
    }
    return this.deck;
  }

  deal(num) {
    return this.deck.splice(0, num);
  }

  static getBestRank(hand, table) {
    console.log(hand, table);
    let bestHand = this.getRank(table);

    //get combinations of both ace on bottom and ace on top
    let combinations = getCombinations([...hand, ...table]).filter(
      (elem) => elem.length == 5
    );
    combinations.forEach((list) => list.sort(compare1));
    let combinations2 = combinations.map((x) => x.slice());

    combinations2.forEach((list) => list.sort(compare2));

    let combined = [...combinations, ...combinations2];
    let uniqueArray = Array.from(
      new Set(combined.map(JSON.stringify)),
      JSON.parse
    );

    for (let i = 0; i < uniqueArray.length; i++) {
      let thisRank = this.getRank(uniqueArray[i]);

      if (this.firstRankHigher(bestHand, thisRank)) {
        bestHand = thisRank;
      }
    }
    return bestHand;
  }

  static firstRankHigher(rank1, rank2) {
    if (
      rank1.rank > rank2.rank ||
      (rank1.rank == rank2.rank &&
        numbers1.indexOf(rank1.cardNumber) -
          numbers1.indexOf(rank2.cardNumber) <
          0)
    )
      return true;
    return false;
  }

  static getRank(hand) {
    let numbered = this.getNumbered(hand);
    //Royal Flush
    if (
      this.isFlush(hand) &&
      this.isStraight(hand) &&
      hand[0].slice(0, -1) == '10'
    )
      return {
        rank: 1,
        cardNumber: hand[4].slice(0, -1),
      };

    //Straight Flush
    if (this.isFlush(hand) && this.isStraight(hand))
      return {
        rank: 2,
        cardNumber: hand[4].slice(0, -1),
      };

    //Four of a Kind
    if (numbered.indexOf(4) >= 0)
      return {
        rank: 3,
        cardNumber: numbers1[numbered.lastIndexOf(4) - 2],
      };

    //Full House
    if (numbered.indexOf(3) >= 0 && numbered.indexOf(2) >= 0)
      return {
        rank: 4,
        cardNumber: numbers1[numbered.lastIndexOf(3) - 2],
      };

    //Flush
    if (this.isFlush(hand))
      return {
        rank: 5,
        cardNumber: numbers1[numbered.lastIndexOf(1) - 2],
      };

    //Straight
    if (this.isStraight(hand))
      return {
        rank: 6,
        cardNumber: hand[4].slice(0, -1),
      };

    //Three of a kind
    if (numbered.indexOf(3) >= 0)
      return {
        rank: 7,
        cardNumber: numbers1[numbered.lastIndexOf(3) - 2],
      };

    //Two Pair
    if (numbered.slice().filter((x) => x == 2).length == 2)
      return {
        rank: 8,
        cardNumber: numbers1[numbered.lastIndexOf(2) - 2],
      };

    //Pair
    if (numbered.indexOf(2) >= 0)
      return {
        rank: 9,
        cardNumber: numbers1[numbered.lastIndexOf(2) - 2],
      };

    //High card
    return {
      rank: 10,
      cardNumber: numbers1[numbered.lastIndexOf(1) - 2],
    };
  }

  static isFlush(hand) {
    for (let i = 0; i < hand.length - 1; i++) {
      if (hand[i].slice(-1) != hand[i + 1].slice(-1)) {
        return false;
      }
    }
    return true;
  }

  static isStraight(hand) {
    let startingNumber = hand[0].slice(0, -1);
    let startingIndex = numbers2.indexOf(startingNumber);

    for (let i = 1; i < 5; i++) {
      if (numbers1[startingIndex + i - 1] != hand[i].slice(0, -1)) {
        return false;
      }
    }
    return true;
  }

  static getNumbered(hand) {
    let numbered = new Array(numbers1.length + 2).fill(0);

    for (let card of hand) {
      numbered[numbers1.indexOf(card.slice(0, -1)) + 2] += 1;
    }

    return numbered;
  }
}

module.exports = { Deck };
