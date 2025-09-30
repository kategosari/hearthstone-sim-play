import { Card, Player, BoardMinion } from '@/types/game';

const cardDatabase: Card[] = [
  { id: '1', name: 'Warrior', cost: 1, attack: 2, health: 1, maxHealth: 1 },
  { id: '2', name: 'Knight', cost: 2, attack: 3, health: 2, maxHealth: 2 },
  { id: '3', name: 'Mage', cost: 3, attack: 2, health: 4, maxHealth: 4 },
  { id: '4', name: 'Dragon', cost: 4, attack: 4, health: 4, maxHealth: 4 },
  { id: '5', name: 'Guardian', cost: 2, attack: 1, health: 4, maxHealth: 4 },
  { id: '6', name: 'Archer', cost: 3, attack: 4, health: 2, maxHealth: 2 },
  { id: '7', name: 'Paladin', cost: 4, attack: 3, health: 5, maxHealth: 5 },
  { id: '8', name: 'Assassin', cost: 3, attack: 5, health: 1, maxHealth: 1 },
];

export const generateDeck = (count: number): Card[] => {
  const deck: Card[] = [];
  for (let i = 0; i < count; i++) {
    const card = cardDatabase[Math.floor(Math.random() * cardDatabase.length)];
    deck.push({ ...card, id: `${card.id}-${i}` });
  }
  return deck;
};

export const drawCard = (player: Player): Card | null => {
  // In a real game, would draw from deck
  const newCard = cardDatabase[Math.floor(Math.random() * cardDatabase.length)];
  return { ...newCard, id: `${newCard.id}-${Date.now()}` };
};

export const canPlayCard = (card: Card, player: Player): boolean => {
  return card.cost <= player.mana && player.board.length < 7;
};

export const playCard = (card: Card, player: Player): Player => {
  if (!canPlayCard(card, player)) return player;
  
  const newMinion: BoardMinion = {
    ...card,
    canAttack: false,
    hasAttacked: false,
  };

  return {
    ...player,
    mana: player.mana - card.cost,
    hand: player.hand.filter(c => c.id !== card.id),
    board: [...player.board, newMinion],
  };
};

export const attackMinion = (
  attacker: BoardMinion,
  defender: BoardMinion,
  attackerPlayer: Player,
  defenderPlayer: Player
): { attacker: Player; defender: Player } => {
  const newAttackerBoard = attackerPlayer.board.map(m => {
    if (m.id === attacker.id) {
      return {
        ...m,
        health: m.health - defender.attack,
        hasAttacked: true,
        canAttack: false,
      };
    }
    return m;
  }).filter(m => m.health > 0);

  const newDefenderBoard = defenderPlayer.board.map(m => {
    if (m.id === defender.id) {
      return {
        ...m,
        health: m.health - attacker.attack,
      };
    }
    return m;
  }).filter(m => m.health > 0);

  return {
    attacker: { ...attackerPlayer, board: newAttackerBoard },
    defender: { ...defenderPlayer, board: newDefenderBoard },
  };
};

export const attackHero = (
  attacker: BoardMinion,
  attackerPlayer: Player,
  defenderPlayer: Player
): { attacker: Player; defender: Player } => {
  const newAttackerBoard = attackerPlayer.board.map(m => {
    if (m.id === attacker.id) {
      return {
        ...m,
        hasAttacked: true,
        canAttack: false,
      };
    }
    return m;
  });

  return {
    attacker: { ...attackerPlayer, board: newAttackerBoard },
    defender: { ...defenderPlayer, health: defenderPlayer.health - attacker.attack },
  };
};

export const startTurn = (player: Player): Player => {
  const newMaxMana = Math.min(player.maxMana + 1, 10);
  const newCard = drawCard(player);
  
  return {
    ...player,
    maxMana: newMaxMana,
    mana: newMaxMana,
    hand: newCard ? [...player.hand, newCard] : player.hand,
    board: player.board.map(m => ({
      ...m,
      canAttack: true,
      hasAttacked: false,
    })),
  };
};

export const makeAIMove = (ai: Player, opponent: Player): { ai: Player; opponent: Player } => {
  let currentAI = { ...ai };
  let currentOpponent = { ...opponent };

  // Play cards if possible
  const playableCards = currentAI.hand.filter(card => canPlayCard(card, currentAI));
  for (const card of playableCards) {
    currentAI = playCard(card, currentAI);
  }

  // Attack with minions
  const attackers = currentAI.board.filter(m => m.canAttack && !m.hasAttacked);
  for (const attacker of attackers) {
    if (currentOpponent.board.length > 0) {
      // Attack random enemy minion
      const target = currentOpponent.board[Math.floor(Math.random() * currentOpponent.board.length)];
      const result = attackMinion(attacker, target, currentAI, currentOpponent);
      currentAI = result.attacker;
      currentOpponent = result.defender;
    } else {
      // Attack hero
      const result = attackHero(attacker, currentAI, currentOpponent);
      currentAI = result.attacker;
      currentOpponent = result.defender;
    }
  }

  return { ai: currentAI, opponent: currentOpponent };
};
