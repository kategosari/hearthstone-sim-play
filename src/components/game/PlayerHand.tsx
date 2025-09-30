import { Card } from '@/types/game';
import { GameCard } from './GameCard';

interface PlayerHandProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  playerMana: number;
}

export const PlayerHand = ({ cards, onCardClick, playerMana }: PlayerHandProps) => {
  return (
    <div className="p-6 bg-game-player rounded-t-lg border-t-2 border-x-2 border-accent shadow-lg">
      <div className="flex justify-center items-end gap-3 flex-wrap">
        {cards.length === 0 ? (
          <div className="text-muted-foreground text-sm py-4">Your hand is empty</div>
        ) : (
          cards.map((card) => {
            const isPlayable = card.cost <= playerMana;
            return (
              <GameCard
                key={card.id}
                card={card}
                onClick={() => isPlayable && onCardClick(card)}
                isPlayable={isPlayable}
                isInHand={true}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
