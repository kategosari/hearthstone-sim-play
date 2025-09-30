import { useState, useEffect } from 'react';
import { GameState, Card, BoardMinion } from '@/types/game';
import { generateDeck, playCard, attackMinion, attackHero, startTurn, makeAIMove } from '@/utils/gameLogic';
import { PlayerArea } from '@/components/game/PlayerArea';
import { GameBoard } from '@/components/game/GameBoard';
import { PlayerHand } from '@/components/game/PlayerHand';
import { GameOverScreen } from '@/components/game/GameOverScreen';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      id: 'player',
      health: 30,
      maxHealth: 30,
      mana: 1,
      maxMana: 1,
      hand: generateDeck(4),
      board: [],
    },
    enemy: {
      id: 'enemy',
      health: 30,
      maxHealth: 30,
      mana: 1,
      maxMana: 1,
      hand: generateDeck(4),
      board: [],
    },
    phase: 'player-turn',
    winner: null,
  });

  const [selectedMinion, setSelectedMinion] = useState<BoardMinion | null>(null);
  const [targetMode, setTargetMode] = useState<'minion' | 'hero' | null>(null);
  const [attackingMinionId, setAttackingMinionId] = useState<string | null>(null);
  const [targetMinionId, setTargetMinionId] = useState<string | null>(null);
  const [damageMap, setDamageMap] = useState<Map<string, number>>(new Map());

  // Check for game over
  useEffect(() => {
    if (gameState.player.health <= 0) {
      setGameState(prev => ({ ...prev, phase: 'game-over', winner: 'enemy' }));
      toast.error('Defeat! Your hero has fallen.');
    } else if (gameState.enemy.health <= 0) {
      setGameState(prev => ({ ...prev, phase: 'game-over', winner: 'player' }));
      toast.success('Victory! You have defeated your opponent!');
    }
  }, [gameState.player.health, gameState.enemy.health]);

  // Handle AI turn
  useEffect(() => {
    if (gameState.phase === 'enemy-turn' && gameState.winner === null) {
      const timer = setTimeout(() => {
        const { ai, opponent } = makeAIMove(gameState.enemy, gameState.player);
        setGameState(prev => ({
          ...prev,
          enemy: ai,
          player: opponent,
        }));

        // End AI turn after a delay
        setTimeout(() => {
          if (opponent.health > 0) {
            const newPlayer = startTurn(opponent);
            setGameState(prev => ({
              ...prev,
              player: newPlayer,
              phase: 'player-turn',
            }));
            toast.info('Your turn!');
          }
        }, 1000);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.enemy, gameState.player, gameState.winner]);

  const handlePlayCard = (card: Card) => {
    if (gameState.phase !== 'player-turn') return;

    const newPlayer = playCard(card, gameState.player);
    if (newPlayer === gameState.player) {
      toast.error('Cannot play this card!');
      return;
    }

    setGameState(prev => ({ ...prev, player: newPlayer }));
    toast.success(`Played ${card.name}!`);
  };

  const handlePlayerMinionClick = (minion: BoardMinion) => {
    if (gameState.phase !== 'player-turn') return;
    
    if (minion.canAttack && !minion.hasAttacked) {
      setSelectedMinion(minion);
      setTargetMode(gameState.enemy.board.length > 0 ? 'minion' : 'hero');
      toast.info('Select a target to attack!');
    }
  };

  const handleEnemyMinionClick = (target: BoardMinion) => {
    if (!selectedMinion || targetMode !== 'minion' || gameState.phase !== 'player-turn') return;

    // Trigger attack animation
    setAttackingMinionId(selectedMinion.id);
    setTargetMinionId(target.id);

    setTimeout(() => {
      const result = attackMinion(selectedMinion, target, gameState.player, gameState.enemy);
      
      // Show damage numbers
      const newDamageMap = new Map(damageMap);
      newDamageMap.set(target.id, selectedMinion.attack);
      if (target.attack > 0) {
        newDamageMap.set(selectedMinion.id, target.attack);
      }
      setDamageMap(newDamageMap);
      
      setGameState(prev => ({
        ...prev,
        player: result.attacker,
        enemy: result.defender,
      }));

      toast.success(`${selectedMinion.name} attacks ${target.name}!`);
      
      // Clear animations
      setTimeout(() => {
        setAttackingMinionId(null);
        setTargetMinionId(null);
      }, 300);
    }, 300);

    setSelectedMinion(null);
    setTargetMode(null);
  };

  const handleEnemyHeroClick = () => {
    if (!selectedMinion || gameState.phase !== 'player-turn') return;
    if (gameState.enemy.board.length > 0 && targetMode === 'minion') {
      toast.error('You must attack enemy minions first!');
      return;
    }

    // Trigger attack animation
    setAttackingMinionId(selectedMinion.id);

    setTimeout(() => {
      const result = attackHero(selectedMinion, gameState.player, gameState.enemy);
      setGameState(prev => ({
        ...prev,
        player: result.attacker,
        enemy: result.defender,
      }));

      toast.success(`${selectedMinion.name} attacks the enemy hero for ${selectedMinion.attack} damage!`);
      
      // Clear animations
      setTimeout(() => {
        setAttackingMinionId(null);
      }, 300);
    }, 300);

    setSelectedMinion(null);
    setTargetMode(null);
    setDamageMap(new Map());
  };

  const handleEndTurn = () => {
    if (gameState.phase !== 'player-turn') return;

    setGameState(prev => ({ ...prev, phase: 'enemy-turn' }));
    
    const newEnemy = startTurn(gameState.enemy);
    setGameState(prev => ({ ...prev, enemy: newEnemy }));
    
    toast.info("Enemy's turn...");
  };

  const handleRestart = () => {
    setGameState({
      player: {
        id: 'player',
        health: 30,
        maxHealth: 30,
        mana: 1,
        maxMana: 1,
        hand: generateDeck(4),
        board: [],
      },
      enemy: {
        id: 'enemy',
        health: 30,
        maxHealth: 30,
        mana: 1,
        maxMana: 1,
        hand: generateDeck(4),
        board: [],
      },
      phase: 'player-turn',
      winner: null,
    });
    setSelectedMinion(null);
    setTargetMode(null);
  };

  return (
    <div className="min-h-screen bg-game-board p-4 flex flex-col">
      {/* Game Over Screen */}
      {gameState.winner && (
        <GameOverScreen winner={gameState.winner} onRestart={handleRestart} />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-foreground bg-gradient-magic bg-clip-text text-transparent">
          Card Battle Arena
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={handleRestart}
            variant="outline"
            className="border-border hover:bg-muted"
          >
            New Game
          </Button>
          <Button
            onClick={handleEndTurn}
            disabled={gameState.phase !== 'player-turn'}
            className="bg-gradient-gold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            End Turn
          </Button>
        </div>
      </div>

      {/* Enemy Area */}
      <div className="mb-4">
        <div onClick={targetMode === 'hero' ? handleEnemyHeroClick : undefined} className={targetMode === 'hero' ? 'cursor-pointer' : ''}>
          <PlayerArea player={gameState.enemy} isEnemy />
        </div>
      </div>

      {/* Enemy Board */}
      <div className="mb-4">
        <GameBoard
          minions={gameState.enemy.board}
          onMinionClick={handleEnemyMinionClick}
          selectedMinionId={selectedMinion?.id}
          isEnemy
          canAttack={false}
          attackingMinionId={attackingMinionId}
          targetMinionId={targetMinionId}
          damageMap={damageMap}
        />
      </div>

      {/* Center Divider */}
      <div className="my-4 border-t-2 border-primary/30" />

      {/* Player Board */}
      <div className="mb-4">
        <GameBoard
          minions={gameState.player.board}
          onMinionClick={handlePlayerMinionClick}
          selectedMinionId={selectedMinion?.id}
          canAttack={gameState.phase === 'player-turn'}
          attackingMinionId={attackingMinionId}
          targetMinionId={targetMinionId}
          damageMap={damageMap}
        />
      </div>

      {/* Player Area */}
      <div className="mb-4">
        <PlayerArea player={gameState.player} />
      </div>

      {/* Player Hand */}
      <div className="mt-auto">
        <PlayerHand
          cards={gameState.player.hand}
          onCardClick={handlePlayCard}
          playerMana={gameState.player.mana}
        />
      </div>
    </div>
  );
};

export default Index;
