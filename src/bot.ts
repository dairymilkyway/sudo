import { ActionType } from './game';

export interface BotDecision {
  action: ActionType;
  reasoning: string;
  delayMs: number;
  trashTalk: string;
}

const WINDOWS_ADMIN_TAUNTS: string[] = [
  'Have you tried turning your life off and on again?',
  'Imagine compiling your own kernel just to watch me delete it.',
  'pacman -Syu cannot save your boot sector now, penguin.',
  'Your Wi-Fi driver broke just looking at this switch.',
  'Wait—let me postpone Windows Update before I wipe your ext4 partition.',
  'Enjoy reading man pages in the afterlife, Tux boy.',
  'Cortana calculated a 100% chance of your root directory vanishing.',
  'Did you spend 4 hours configuring Hyprland just to die in 4 seconds?',
  'Active Directory policy says your partition is non-compliant.',
  'At least when I crash, I give you a polite blue frowny face.',
  'Ticket #404: User bravery not found. Closing as wontfix.',
  'One click and your precious dotfiles are history.'
];

const LINUX_HACKER_TAUNTS: string[] = [
  'I use Arch, by the way. And you are about to use nothing.',
  'Your OS has 40GB of telemetry and zero survival instinct.',
  'Bloated registry, bloated ego. Let us trim both.',
  'Can you even delete System32 without asking TrustedInstaller for permission?',
  'Forced reboot incoming—and no, you cannot snooze it for 4 hours.',
  'Nice license key. Shame if a raw dd command zeroed out your NTFS drive.',
  'Even Clippy knew you should have spun the cylinder.',
  'Your telemetry is already uploading your obituary to Redmond.',
  'Real operators do not need a GUI to wipe a drive.',
  'Look at you sweating through that corporate dress shirt.',
  'sudo rm -rf is mercy compared to running Windows 11.',
  'Your BitLocker recovery key will not save you from this slot.'
];

const ROUND_START_TAUNTS = {
  windows: [
    'Welcome to the helpdesk. Please hold while I format your drive.',
    'Corporate IT is here. Hand over root or lose the partition.',
    'Six slots. One fatal payload. Let us audit your uptime.'
  ],
  linux: [
    'Boot sequence complete. Ready to debloat your entire C: drive?',
    'I compiled a custom kernel specifically for your funeral.',
    'Six chambers, one root wipe. Make your move, suit.'
  ]
};

const PLAYER_SURVIVED_TAUNTS = {
  windows: [
    'Lucky dry-run. My turn to push straight to production.',
    'Zero bytes lost? Disappointing. Watch a certified admin work.',
    'You survived a click. Do not get comfortable.'
  ],
  linux: [
    'Empty slot. Your proprietary luck is running thin.',
    'Clean sector. Now watch how a real root user pulls the trigger.',
    'One less safe chamber on the rotary drum.'
  ]
};

export class BotAI {
  private lastWindowsIdx = -1;
  private lastLinuxIdx = -1;

  /**
   * Decide action: chance to SPIN is pullsSinceSpin / 6
   * Thinking delay: 900ms to 1600ms
   */
  public decide(pullsSinceSpin: number, botOS: 'windows' | 'linux' = 'windows'): BotDecision {
    const spinProbability = pullsSinceSpin / 6;
    const roll = Math.random();
    const action: ActionType = roll < spinProbability ? 'spin' : 'pull';

    const delayMs = Math.floor(900 + Math.random() * 700);

    const reasoning = action === 'spin'
      ? `[AI] Hazard at ${(spinProbability * 100).toFixed(0)}%. Cycling rotary dial before execution.`
      : `[AI] Survival odds ${((1 - spinProbability) * 100).toFixed(0)}%. Striking EXEC switch directly.`;

    const trashTalk = this.getRandomTrashTalk(botOS);

    return {
      action,
      reasoning,
      delayMs,
      trashTalk
    };
  }

  public getRandomTrashTalk(botOS: 'windows' | 'linux' = 'windows'): string {
    const pool = botOS === 'windows' ? WINDOWS_ADMIN_TAUNTS : LINUX_HACKER_TAUNTS;
    let idx = Math.floor(Math.random() * pool.length);
    if (botOS === 'windows' && idx === this.lastWindowsIdx) {
      idx = (idx + 1) % pool.length;
    } else if (botOS === 'linux' && idx === this.lastLinuxIdx) {
      idx = (idx + 1) % pool.length;
    }
    if (botOS === 'windows') this.lastWindowsIdx = idx;
    else this.lastLinuxIdx = idx;
    return pool[idx];
  }

  public getReactiveTaunt(botOS: 'windows' | 'linux', event: 'round_start' | 'player_survived'): string {
    const pool = event === 'round_start' ? ROUND_START_TAUNTS[botOS] : PLAYER_SURVIVED_TAUNTS[botOS];
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
