import { Button } from '@/components/ui/button';
import { Trophy, Skull } from 'lucide-react';

interface GameOverScreenProps {
  winner: 'player' | 'enemy';
  onRestart: () => void;
}

export const GameOverScreen = ({ winner, onRestart }: GameOverScreenProps) => {
  const isVictory = winner === 'player';

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border-2 border-primary rounded-2xl p-12 text-center max-w-md shadow-2xl animate-float">
        <div className="mb-6">
          {isVictory ? (
            <Trophy className="w-24 h-24 text-secondary mx-auto animate-glow-pulse" />
          ) : (
            <Skull className="w-24 h-24 text-destructive mx-auto" />
          )}
        </div>

        <h1 className="text-4xl font-bold mb-4 text-foreground">
          {isVictory ? 'Victory!' : 'Defeat'}
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          {isVictory 
            ? 'You have defeated your opponent!' 
            : 'Your opponent has bested you in combat.'}
        </p>

        <Button 
          onClick={onRestart} 
          size="lg"
          className="bg-gradient-magic hover:opacity-90 transition-opacity text-lg px-8"
        >
          Play Again
        </Button>
      </div>
    </div>
  );
};
