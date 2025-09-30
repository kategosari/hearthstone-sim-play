import { useState, useEffect, useRef } from 'react';
import { GameState, Card, BoardMinion } from '@/types/game';
import { generateDeck, playCard, attackMinion, attackHero, startTurn, makeAIMove } from '@/utils/gameLogic';
import { PlayerArea } from '@/components/game/PlayerArea';
import { GameBoard } from '@/components/game/GameBoard';
import { PlayerHand } from '@/components/game/PlayerHand';
import { GameOverScreen } from '@/components/game/GameOverScreen';
import { AttackingCard } from '@/components/game/AttackingCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      id: 'player',
      health: 30,
      maxHealth: 30,
      mana: 4,
      maxMana: 4,
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
  
  // Track card positions for collision animation
  const minionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [attackAnimation, setAttackAnimation] = useState<{
    attacker: BoardMinion;
    startPos: { x: number; y: number };
    targetPos: { x: number; y: number };
    damage: number;
  } | null>(null);

  
  const setMinionRef = (id: string, element: HTMLDivElement | null) => {
    if (element) {
      minionRefs.current.set(id, element);
    } else {
      minionRefs.current.delete(id);
    }
  };

  const getCardPosition = (element: HTMLDivElement): { x: number; y: number } => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
    };
  };

  // Check for game over
  useEffect(() => {
    if (gameState.player.health <= 0) {
      setGameState(prev => ({ ...prev, phase: 'game-over', winner: 'enemy' }));
      toast.error('Defeat! Your hero has fallen.');
    } else if (gameState.enemy.health <= 0) {
      setGameState(prev => ({ ...prev, phase: 'game-over', winner: 'player' }));
      toast.success('승리!! 당신이 적군을 물리쳤습니다!!!');
    }
  }, [gameState.player.health, gameState.enemy.health]);

  // Handle AI turn
  useEffect(() => {
    if (gameState.phase === 'enemy-turn' && gameState.winner === null) {
      const timer = setTimeout(() => {
        const { ai, opponent, lastAttack } = makeAIMove(gameState.enemy, gameState.player);
        setGameState(prev => ({
          ...prev,
          enemy: ai,
          player: opponent,
          lastAttack,
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
            toast.info('당신의 차례입니다!');
          }
        }, 1000);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.enemy, gameState.player, gameState.winner]);

  //적군이 공격하는 걸 보여주기위한 부분
  // Handle AI turn
useEffect(() => {
  if (gameState.phase === 'enemy-turn' && gameState.winner === null) {
    const timer = setTimeout(() => {
      const { ai, opponent, lastAttack } = makeAIMove(gameState.enemy, gameState.player);
      setGameState(prev => ({
        ...prev,
        enemy: ai,
        player: opponent,
        lastAttack, // 👈 추가
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
          toast.info('당신의 차례입니다!');
        }
      }, 1000);
    }, 1500);

    return () => clearTimeout(timer);
  }
}, [gameState.phase, gameState.enemy, gameState.player, gameState.winner]);

// 👇 여기 추가하세요
useEffect(() => {
  if (gameState.lastAttack && gameState.lastAttack.targetType === 'hero') {
    const playerElement = document.getElementById("player-area");
    if (playerElement) {
      playerElement.classList.add("animate-shake");
      setTimeout(() => playerElement.classList.remove("animate-shake"), 500);
    }
    console.log(gameState.lastAttack)

    toast.error("적이 당신을 공격했습니다!");
  }
}, [gameState.lastAttack]);
//여기 위에 추가함

  const handlePlayCard = (card: Card) => {
    if (gameState.phase !== 'player-turn') return;

    const newPlayer = playCard(card, gameState.player);
    if (newPlayer === gameState.player) {
      toast.error('Cannot play this card!');
      return;
    }

    setGameState(prev => ({ ...prev, player: newPlayer }));
    toast.success(`${card.name} 카드를 내셨습니다!`);
  };

  const handlePlayerMinionClick = (minion: BoardMinion) => {
    if (gameState.phase !== 'player-turn') return;
    
    if (minion.canAttack && !minion.hasAttacked) {
      setSelectedMinion(minion);
      setTargetMode(gameState.enemy.board.length > 0 ? 'minion' : 'hero');
      toast.info('공격할 대상을 선택해주새요!');
    }
  };

  const handleEnemyMinionClick = (target: BoardMinion) => {
    if (!selectedMinion || targetMode !== 'minion' || gameState.phase !== 'player-turn') return;

    const attackerElement = minionRefs.current.get(selectedMinion.id);
    const targetElement = minionRefs.current.get(target.id);

    if (!attackerElement || !targetElement) {
      // Fallback if positions not found
      const result = attackMinion(selectedMinion, target, gameState.player, gameState.enemy);
      setGameState(prev => ({
        ...prev,
        player: result.attacker,
        enemy: result.defender,
      }));
      toast.success(`${selectedMinion.name} attacks ${target.name}!`);
      setSelectedMinion(null);
      setTargetMode(null);
      return;
    }

    const startPos = getCardPosition(attackerElement);
    const targetPos = getCardPosition(targetElement);

    // Start attack animation
    setAttackAnimation({
      attacker: selectedMinion,
      startPos,
      targetPos,
      damage: selectedMinion.attack,
    });
    setTargetMinionId(target.id);

    // Store for after animation
    const attackData = { selectedMinion, target };

    setSelectedMinion(null);
    setTargetMode(null);

    // Apply damage after animation completes
    setTimeout(() => {
      const result = attackMinion(attackData.selectedMinion, attackData.target, gameState.player, gameState.enemy);
      setGameState(prev => ({
        ...prev,
        player: result.attacker,
        enemy: result.defender,
      }));
      toast.success(`${attackData.selectedMinion.name}가 ${attackData.target.name}를 공격하였습니다!`);
    }, 550);
  };

  const handleEnemyHeroClick = () => {
    if (!selectedMinion || gameState.phase !== 'player-turn') return;
    if (gameState.enemy.board.length > 0 && targetMode === 'minion') {
      toast.error('보드의 상대 카드를 먼저 공격하셔야합니다!');
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
    setAttackAnimation(null);
    setAttackingMinionId(null);
    setTargetMinionId(null);
  };

  const handleEndTurn = () => {
    if (gameState.phase !== 'player-turn') return;

    setGameState(prev => ({ ...prev, phase: 'enemy-turn' }));
    
    const newEnemy = startTurn(gameState.enemy);
    setGameState(prev => ({ ...prev, enemy: newEnemy }));
    
    toast.info("상대 차례 입니다");
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
    <div className="min-h-screen bg-game-board p-4 flex flex-col relative">
      {/* Attack Animation Overlay */}
      {attackAnimation && (
        <AttackingCard
          attacker={attackAnimation.attacker}
          startPos={attackAnimation.startPos}
          targetPos={attackAnimation.targetPos}
          damageDealt={attackAnimation.damage}
          onComplete={() => {
            setAttackAnimation(null);
            setTargetMinionId(null);
          }}
        />
      )}

      {/* Game Over Screen */}
      {gameState.winner && (
        <GameOverScreen winner={gameState.winner} onRestart={handleRestart} />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-foreground bg-gradient-magic bg-clip-text text-transparent">
          Orange Flaver Allstar
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={handleRestart}
            variant="outline"
            className="border-border hover:bg-muted"
          >
            새로운 게임
          </Button>
          <Button
            onClick={handleEndTurn}
            disabled={gameState.phase !== 'player-turn'}
            className="bg-gradient-gold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            턴 넘기기
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
          onMinionPositionRef={setMinionRef}
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
          onMinionPositionRef={setMinionRef}
        />
      </div>

      {/* Player Area */}
      <div className="mb-4" id="player-area">
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
