import { ActionType } from './game';

export interface BotDecision {
  action: ActionType;
  reasoning: string;
  delayMs: number;
  trashTalk?: string;
}

const TRASH_TALK_LINES: string[] = [
  'Have you tried turning it off and on again?',
  'I would uninstall myself but I am Windows.',
  'Nice uptime. Shame about the next 5 seconds.',
  'Imagine compiling your kernel just to pull a trigger.',
  'At least my blue screen has a cute smiley face :(',
  'Are you running as root? Because you are about to get owned.',
  'Registry error: user bravery not found.',
  'Wait, let me configure Windows Update before I pull...',
  'pacman -Syu cannot save your cylinder position.',
  'Enjoy your man pages in the afterlife, tux boy.',
  'Cortana predicted a 100% chance of kernel failure.',
  'Segment fault (chamber dumped).',
  'Did you forget to chmod +x your survival script?'
];

export class BotAI {
  /**
   * Decide action: chance to SPIN is pullsSinceSpin / 6
   * Thinking delay: 800ms to 1800ms
   */
  public decide(pullsSinceSpin: number): BotDecision {
    const spinProbability = pullsSinceSpin / 6;
    const roll = Math.random();
    const action: ActionType = roll < spinProbability ? 'spin' : 'pull';

    const delayMs = Math.floor(800 + Math.random() * 1000); // 800 - 1800ms

    const reasoning = action === 'spin'
      ? `[DECISION] Probability of bullet is ${(spinProbability * 100).toFixed(1)}%. Initiating chamber spin...`
      : `[DECISION] Odds favorable (${((1 - spinProbability) * 100).toFixed(1)}% safe). Pulling trigger directly.`;

    // 40% chance of trash talk line
    let trashTalk: string | undefined;
    if (Math.random() < 0.45) {
      trashTalk = TRASH_TALK_LINES[Math.floor(Math.random() * TRASH_TALK_LINES.length)];
    }

    return {
      action,
      reasoning,
      delayMs,
      trashTalk
    };
  }

  public getRandomTrashTalk(): string {
    return TRASH_TALK_LINES[Math.floor(Math.random() * TRASH_TALK_LINES.length)];
  }
}
