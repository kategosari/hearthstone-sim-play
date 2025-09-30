import { Card, Player, BoardMinion } from '@/types/game';
import { cardDatabase } from '@/types/cardDatabase';

// const cardDatabase: Card[] = [
  // { id: '1', name: '전사', cost: 1, attack: 2, health: 1, maxHealth: 1 , image: '/img/불.png'},
  // { id: '2', name: '기사', cost: 2, attack: 3, health: 2, maxHealth: 2 },
  // { id: '3', name: '마법사', cost: 3, attack: 2, health: 4, maxHealth: 4 },
  // { id: '4', name: '드래곤', cost: 4, attack: 4, health: 4, maxHealth: 4 },
  // { id: '5', name: '가디언', cost: 2, attack: 1, health: 4, maxHealth: 4 },
  // { id: '6', name: '궁수', cost: 3, attack: 4, health: 2, maxHealth: 2 },
  // { id: '7', name: '성기사', cost: 4, attack: 3, health: 5, maxHealth: 5 },
  // { id: '8', name: '암살자', cost: 3, attack: 5, health: 1, maxHealth: 1 },
//];


const types = ["불", "물", "번개", "흙", "얼음", "빛", "어둠", "기계", "정신", "혼돈"];

const modifierMatrix: number[][] = [
  [2,1,2,2,4,2,2,4,2,2], // 불🔥
  [4,2,1,1,2,2,2,4,2,2], // 물💧
  [2,4,2,1,2,2,2,4,2,2], // 번개⚡
  [2,4,4,2,4,2,2,2,4,4], // 흙🌍
  [1,2,2,1,2,4,2,1,4,2], // 얼음❄️
  [2,2,2,2,1,2,2,2,4,1], // 빛🌞
  [2,2,2,2,2,2,2,2,4,4], // 어둠⚫
  [1,1,1,2,4,2,2,2,4,4], // 기계🤖
  [2,2,2,1,1,1,1,1,2,4], // 정신🧠
  [2,2,2,1,2,4,1,1,1,2], // 혼돈🍸
];

function modifier(attacker: string, defender: string): number {
  const attackerIndex = types.indexOf(attacker);
  const defenderIndex = types.indexOf(defender);

  if (attackerIndex === -1 || defenderIndex === -1) {
    throw new Error("알 수 없는 타입입니다!");
  }

  return modifierMatrix[attackerIndex][defenderIndex]/2;
}



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
        health: m.health - Math.round(defender.attack*modifier(attacker.attribute,defender.attribute)),
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
        health: m.health - Math.round(attacker.attack*modifier(defender.attribute,attacker.attribute)),
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

export const makeAIMove = (ai: Player, opponent: Player): { ai: Player; opponent: Player;lastAttack?: { attackerId: string; targetId: string; targetType: 'minion' | 'hero' } } => {
  let currentAI = { ...ai };
  let currentOpponent = { ...opponent };
  let lastAttack: { attackerId: string; targetId: string; targetType: 'minion' | 'hero' } | undefined;

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

      // 👇 공격 정보를 기록 (예시)
      // 이 정보는 UI(PlayerArea.tsx)로 전달되어
      // "animate-shake" 같은 효과를 줄 수 있음
    lastAttack = {
      attackerId: attacker.id,
      targetId: currentOpponent.id,  // 본체
      targetType: 'hero'
  };
    }
  }

  return { ai: currentAI, opponent: currentOpponent,lastAttack };
};
