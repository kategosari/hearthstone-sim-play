import { Card, BoardMinion } from '@/types/game';
import { Swords, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameCardProps {
  card: Card | BoardMinion;
  onClick?: () => void;
  isPlayable?: boolean;
  isSelected?: boolean;
  isInHand?: boolean;
  canAttack?: boolean;
}

export const GameCard = ({ 
  card, 
  onClick, 
  isPlayable = false, 
  isSelected = false,
  isInHand = false,
  canAttack = false,
}: GameCardProps) => {
  const boardMinion = 'canAttack' in card ? card : null;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative w-28 h-36 rounded-lg border-2 transition-all duration-300 cursor-pointer",
        "bg-gradient-card border-border hover:border-primary",
        isPlayable && "hover:scale-105 hover:animate-glow-pulse border-secondary",
        isSelected && "scale-105 border-secondary shadow-lg shadow-secondary/50",
        !isPlayable && !canAttack && onClick && "opacity-60 cursor-not-allowed",
        canAttack && "border-game-attack hover:animate-glow-pulse",
        isInHand && "hover:-translate-y-2"
      )}
    >
      {/* Mana Cost */}
      <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-game-mana flex items-center justify-center font-bold text-foreground shadow-lg border-2 border-primary z-10">
        {card.cost}
      </div>

      {/* Card Name */}
      <div className="p-2 text-center">
        <h3 className="text-sm font-bold text-foreground truncate">{card.name}</h3>
      </div>

      {/* Card Image/Icon */}
      <div className="flex-1 flex items-center justify-center p-2">
        <Sparkles className="w-12 h-12 text-primary" />
      </div>

      {/* Stats */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between p-2">
        {/* Attack */}
        <div className="flex items-center gap-1 bg-game-attack rounded-full px-2 py-1 shadow-lg border border-foreground/20">
          <Swords className="w-3 h-3 text-foreground" />
          <span className="text-sm font-bold text-foreground">{card.attack}</span>
        </div>

        {/* Health */}
        <div className="flex items-center gap-1 bg-game-health rounded-full px-2 py-1 shadow-lg border border-foreground/20">
          <Heart className="w-3 h-3 text-foreground" />
          <span className="text-sm font-bold text-foreground">{card.health}</span>
        </div>
      </div>

      {/* Attack indicator */}
      {boardMinion && boardMinion.canAttack && !boardMinion.hasAttacked && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-gold rounded-full flex items-center justify-center shadow-lg animate-glow-pulse">
          <Swords className="w-4 h-4 text-destructive-foreground" />
        </div>
      )}
    </div>
  );
};
