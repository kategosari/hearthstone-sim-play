import { BoardMinion } from '@/types/game';
import { GameCard } from './GameCard';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  minions: BoardMinion[];
  onMinionClick?: (minion: BoardMinion) => void;
  selectedMinionId?: string;
  isEnemy?: boolean;
  canAttack?: boolean;
  attackingMinionId?: string;
  targetMinionId?: string;
  damageMap?: Map<string, number>;
}

export const GameBoard = ({ 
  minions, 
  onMinionClick, 
  selectedMinionId,
  isEnemy = false,
  canAttack = false,
  attackingMinionId,
  targetMinionId,
  damageMap,
}: GameBoardProps) => {
  return (
    <div className={cn(
      "min-h-[180px] p-4 rounded-lg border-2 bg-card/50",
      isEnemy ? "border-destructive/30" : "border-accent/30"
    )}>
      <div className="flex justify-center items-center gap-3 flex-wrap">
        {minions.length === 0 ? (
          <div className="text-muted-foreground text-sm py-8">
            {isEnemy ? 'Enemy board is empty' : 'Your board is empty - play some cards!'}
          </div>
        ) : (
          minions.map((minion) => (
            <GameCard
              key={minion.id}
              card={minion}
              onClick={() => onMinionClick?.(minion)}
              isSelected={selectedMinionId === minion.id}
              canAttack={canAttack && minion.canAttack && !minion.hasAttacked}
              isAttacking={attackingMinionId === minion.id}
              isBeingAttacked={targetMinionId === minion.id}
              damageDealt={damageMap?.get(minion.id)}
              isEnemy={isEnemy}
            />
          ))
        )}
      </div>
    </div>
  );
};
