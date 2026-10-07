export type Actor = 'player' | 'bot';

export type GamePhase =
  | 'idle'
  | 'player_turn'
  | 'bot_turn'
  | 'resolving'
  | 'linux_death'
  | 'windows_death'
  | 'game_over';

export interface GameState {
  currentChamber: number; // 0 to 5
  bulletChamber: number;  // 0 to 5
  currentActor: Actor;
  phase: GamePhase;
  pullsSurvivedSinceSpin: number;
  chamberHistory: boolean[]; // 6 slots: true if survived/checked
  winner: Actor | null;
  stats: {
    playerWins: number;
    botWins: number;
  };
}

export type ActionType = 'pull' | 'spin';

export interface ActionResult {
  action: ActionType;
  actor: Actor;
  chamber: number;
  isBullet: boolean;
  survived: boolean;
}

export class GameEngine {
  private state: GameState;

  constructor(initialStats?: { playerWins: number; botWins: number }) {
    this.state = this.createInitialState(initialStats);
  }

  private createInitialState(initialStats?: { playerWins: number; botWins: number }): GameState {
    const bulletChamber = Math.floor(Math.random() * 6);
    return {
      currentChamber: 0,
      bulletChamber,
      currentActor: 'player',
      phase: 'player_turn',
      pullsSurvivedSinceSpin: 0,
      chamberHistory: [false, false, false, false, false, false],
      winner: null,
      stats: initialStats ?? { playerWins: 0, botWins: 0 }
    };
  }

  public getState(): Readonly<GameState> {
    return this.state;
  }

  public reset(keepStats = true): void {
    const stats = keepStats ? { ...this.state.stats } : { playerWins: 0, botWins: 0 };
    this.state = this.createInitialState(stats);
  }

  public spinChamber(): void {
    // Re-randomize current chamber position relative to bullet or randomize chamber index
    this.state.currentChamber = Math.floor(Math.random() * 6);
    this.state.pullsSurvivedSinceSpin = 0;
    // When spinning, cleared chamber checks reset
    this.state.chamberHistory = [false, false, false, false, false, false];
  }

  public executeAction(action: ActionType): ActionResult {
    if (this.state.phase !== 'player_turn' && this.state.phase !== 'bot_turn') {
      throw new Error(`Cannot execute action during phase: ${this.state.phase}`);
    }

    const actor = this.state.currentActor;

    if (action === 'spin') {
      this.spinChamber();
    }

    const firedChamber = this.state.currentChamber;
    const isBullet = firedChamber === this.state.bulletChamber;

    if (isBullet) {
      this.state.winner = actor === 'player' ? 'bot' : 'player';
      if (this.state.winner === 'player') {
        this.state.stats.playerWins++;
        this.state.phase = 'windows_death';
      } else {
        this.state.stats.botWins++;
        this.state.phase = 'linux_death';
      }

      return {
        action,
        actor,
        chamber: firedChamber,
        isBullet: true,
        survived: false
      };
    } else {
      // Survived
      this.state.chamberHistory[firedChamber] = true;
      this.state.pullsSurvivedSinceSpin++;
      // Advance chamber cyclically (0 -> 1 -> 2 -> ... -> 5 -> 0)
      this.state.currentChamber = (firedChamber + 1) % 6;
      // Switch actor
      this.state.currentActor = actor === 'player' ? 'bot' : 'player';
      this.state.phase = this.state.currentActor === 'player' ? 'player_turn' : 'bot_turn';

      return {
        action,
        actor,
        chamber: firedChamber,
        isBullet: false,
        survived: true
      };
    }
  }
}

/**
 * Console test helper: Simulates N games and verifies uniform distribution of bullet chambers.
 */
export function runBulletDistributionTest(trials = 1000): {
  counts: number[];
  percentages: number[];
  isUniform: boolean;
} {
  const counts = [0, 0, 0, 0, 0, 0];

  for (let i = 0; i < trials; i++) {
    const engine = new GameEngine();
    const bullet = engine.getState().bulletChamber;
    counts[bullet]++;
  }

  const expected = trials / 6;
  const tolerance = expected * 0.35; // 35% tolerance for 1000 random samples
  const isUniform = counts.every(c => Math.abs(c - expected) < tolerance);
  const percentages = counts.map(c => Number(((c / trials) * 100).toFixed(2)));

  return { counts, percentages, isUniform };
}
