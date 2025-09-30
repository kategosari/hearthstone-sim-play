export interface Card {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  maxHealth: number;
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
}
