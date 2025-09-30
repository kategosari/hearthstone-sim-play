import { Player } from '@/types/game';
import { Heart, Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerAreaProps {
  player: Player;
  isEnemy?: boolean;
}

export const PlayerArea = ({ player, isEnemy = false }: PlayerAreaProps) => {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-lg border-2",
      isEnemy ? "bg-game-enemy border-destructive" : "bg-game-player border-accent"
    )}>
      {/* Hero Portrait */}
      <div className={cn(
        "w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold",
        isEnemy ? "bg-destructive/20 border-destructive" : "bg-accent/20 border-accent"
      )}>
        {isEnemy ? '👹' : '🛡️'}
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-2">
        {/* Health */}
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-game-health" />
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-foreground">{player.health}</span>
            <span className="text-sm text-muted-foreground">/ {player.maxHealth}</span>
          </div>
        </div>

        {/* Mana */}
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-game-mana" />
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-game-mana">{player.mana}</span>
            <span className="text-sm text-muted-foreground">/ {player.maxMana}</span>
          </div>
        </div>
      </div>

      {/* Mana Crystals Visual */}
      <div className="flex gap-1 ml-2">
        {Array.from({ length: player.maxMana }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-4 h-4 rounded-full border-2",
              i < player.mana 
                ? "bg-game-mana border-game-mana shadow-lg shadow-game-mana/50" 
                : "bg-transparent border-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
};
