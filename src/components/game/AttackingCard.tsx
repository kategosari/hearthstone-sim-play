import { useEffect, useState } from 'react';
import { BoardMinion } from '@/types/game';
import { GameCard } from './GameCard';

interface AttackingCardProps {
  attacker: BoardMinion;
  startPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  onComplete: () => void;
  damageDealt: number;
}

export const AttackingCard = ({ 
  attacker, 
  startPos, 
  targetPos, 
  onComplete,
  damageDealt 
}: AttackingCardProps) => {
  const [position, setPosition] = useState(startPos);
  const [phase, setPhase] = useState<'moving' | 'impact' | 'returning'>('moving');
  const [showDamage, setShowDamage] = useState(false);

  useEffect(() => {
    // Move to target
    const moveTimer = setTimeout(() => {
      setPosition(targetPos);
    }, 50);

    // Impact phase
    const impactTimer = setTimeout(() => {
      setPhase('impact');
      setShowDamage(true);
    }, 350);

    // Return phase
    const returnTimer = setTimeout(() => {
      setPhase('returning');
      setPosition(startPos);
    }, 550);

    // Complete
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 900);

    return () => {
      clearTimeout(moveTimer);
      clearTimeout(impactTimer);
      clearTimeout(returnTimer);
      clearTimeout(completeTimer);
    };
  }, [startPos, targetPos, onComplete]);

  return (
    <>
      <div
        className="fixed pointer-events-none z-50 transition-all duration-300 ease-in-out"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: phase === 'impact' ? 'scale(1.15) rotate(5deg)' : 'scale(1.1)',
        }}
      >
        <GameCard card={attacker} />
      </div>
      
      {/* Damage number at target */}
      {showDamage && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${targetPos.x + 56}px`,
            top: `${targetPos.y}px`,
          }}
        >
          <span className="text-5xl font-bold text-destructive animate-damage-pop drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
            -{damageDealt}
          </span>
        </div>
      )}
    </>
  );
};
