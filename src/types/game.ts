export interface Card {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  maxHealth: number;
  attribute:string;
  image?: string;
}

export interface BoardMinion extends Card {
  canAttack: boolean;
  hasAttacked: boolean;
}

export interface Player {
  id: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  hand: Card[];
  board: BoardMinion[];
}

export type GamePhase = 'player-turn' | 'enemy-turn' | 'game-over';

export interface GameState {
  player: Player;
  enemy: Player;
  phase: GamePhase;
  winner: 'player' | 'enemy' | null;
  //컴퓨터효과 넣기위해 추가한 코드
  lastAttack?: { attackerId: string; targetId: string; targetType: 'minion' | 'hero' };
}
