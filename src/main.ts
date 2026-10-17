import { createScene } from './scene';
import { runBulletDistributionTest, GameEngine, ActionType } from './game';
import { VirtualTerminal } from './terminal';
import { BotAI } from './bot';
import { SoundFX } from './audio';
import { DeathManager } from './death';
import './style.css';

// Milestone 3: Run console test for 1000 games
const testResult = runBulletDistributionTest(1000);
console.log('--- Kernel Roulette Logic Test (1000 trials) ---');
console.log('Bullet chamber counts [0..5]:', testResult.counts);
console.log('Bullet chamber percentages:', testResult.percentages.map(p => `${p}%`).join(', '));
console.log('Is roughly uniform (within tolerance)?', testResult.isUniform);

const app = document.getElementById('app')!;
const sceneContext = createScene(app);
const soundFX = new SoundFX();

// Current Selected Operating System State
let playerOS: 'linux' | 'windows' = 'linux';
let botOS: 'linux' | 'windows' = 'windows';
let isBooting = true;

// Setup Widescreen Terminals
const playerTerminal = new VirtualTerminal({
  width: 768,
  height: 480,
  bgColor: '#061308',
  textColor: '#33ff66',
  promptPrefix: 'player@archlinux:~$ ',
  fontSize: 22,
  osType: 'linux'
});

const botTerminal = new VirtualTerminal({
  width: 768,
  height: 480,
  bgColor: '#06111e',
  textColor: '#00a4ef',
  promptPrefix: 'C:\\Users\\Administrator> ',
  fontSize: 22,
  osType: 'windows'
});

sceneContext.setMonitorTextures(playerTerminal.getTexture(), botTerminal.getTexture());

function initTerminals() {
  playerTerminal.clear();
  botTerminal.clear();

  if (playerOS === 'linux') {
    playerTerminal.addLine('Dual-Boot Arbiter online (/dev/ttyS0)');
    playerTerminal.addLine('Kernel: 6.8.9-arch1-1-x86_64 // SUDO root armed');
    playerTerminal.addLine('6 chambers loaded. 1 fatal discharge payload.');

    botTerminal.addLine('Microsoft Windows [Version 10.0.22631.3296]');
    botTerminal.addLine('(c) Microsoft Corporation. All rights reserved.');
    botTerminal.addLine('WinDefend: Arbiter serial handshake OK on COM3.');
  } else {
    playerTerminal.addLine('Windows PowerShell 7.4.2 [Elevated]');
    playerTerminal.addLine('(c) Microsoft Corporation. Arbiter linked on COM3.');
    playerTerminal.addLine('Volume C: [NTFS] armed. 6 chambers, 1 fatal wipe.');

    botTerminal.addLine('Linux archbox 6.8.9-arch1-1-x86_64 (/dev/ttyS0)');
    botTerminal.addLine('Arch Linux rogue session active. Arbiter bus synced.');
    botTerminal.addLine('Payload chamber primed. Watching opponent move.');
  }
}

// Game loop, bot AI, and HUD wiring
const engine = new GameEngine();
const botAI = new BotAI();

// DOM Elements
const bootLoader = document.getElementById('boot-loader') as HTMLElement;
const bootBiosTitle = document.getElementById('boot-bios-title') as HTMLElement;
const bootStageTag = document.getElementById('boot-stage-tag') as HTMLElement;
const bootLogLines = document.getElementById('boot-log-lines') as HTMLElement;
const bootStatusLabel = document.getElementById('boot-status-label') as HTMLElement;
const bootPercent = document.getElementById('boot-percent') as HTMLElement;
const bootBarFill = document.getElementById('boot-bar-fill') as HTMLElement;

const mainMenu = document.getElementById('main-menu') as HTMLElement;
const cardLinux = document.getElementById('card-linux') as HTMLElement;
const cardWindows = document.getElementById('card-windows') as HTMLElement;
const btnStartGame = document.getElementById('btn-start-game') as HTMLButtonElement;
const menuPreviewLabel = document.getElementById('menu-preview-label') as HTMLElement;

const rackmountTelemetry = document.getElementById('rackmount-telemetry') as HTMLElement;
const hud = document.getElementById('hud') as HTMLElement;
const telemetryPlayerName = document.getElementById('telemetry-player-name') as HTMLElement;
const telemetryBotName = document.getElementById('telemetry-bot-name') as HTMLElement;
const ledPlayer = document.getElementById('led-player') as HTMLElement;
const ledBot = document.getElementById('led-bot') as HTMLElement;
const scorePlayer = document.getElementById('score-player') as HTMLElement;
const scoreBot = document.getElementById('score-bot') as HTMLElement;

const opponentSubtitle = document.getElementById('opponent-subtitle') as HTMLElement;
const subtitleSpeaker = document.getElementById('subtitle-speaker') as HTMLElement;
const subtitleText = document.getElementById('subtitle-text') as HTMLElement;

const turnText = document.getElementById('turn-text') as HTMLElement;
const chamberBays = document.querySelectorAll('#chamber-matrix .chamber-bay');
const btnPull = document.getElementById('btn-pull') as HTMLButtonElement;
const btnSpin = document.getElementById('btn-spin') as HTMLButtonElement;
const btnPullLabel = document.getElementById('btn-pull-label') as HTMLElement;

let subtitleTimer: number | null = null;
let speechToken = 0;

/**
 * Deliver Opponent Trash Talk:
 * 1. Displays stark diegetic subtitle with speaker tag & synthesized speech blips
 * 2. Animates 3D opponent speaking nod/cadence
 * 3. Pipes incoming message directly onto playerTerminal so it's visible on the player's 3D monitor
 */
async function deliverOpponentTaunt(quote: string, holdMs = 2600): Promise<void> {
  const myToken = ++speechToken;
  if (subtitleTimer) {
    clearTimeout(subtitleTimer);
    subtitleTimer = null;
  }

  const isLinuxBot = botOS === 'linux';
  opponentSubtitle.classList.toggle('linux-speaker', isLinuxBot);
  subtitleSpeaker.textContent = isLinuxBot
    ? 'ROGUE ARCH HACKER // /DEV/TTYS0'
    : 'CORPORATE SYSADMIN // COM3';
  subtitleText.textContent = '';
  opponentSubtitle.style.display = 'flex';

  // Pipe taunt onto the player's own 3D CRT monitor so it's readable in-world
  const prefix = isLinuxBot ? '[ttyS0 root@arch]:' : '[COM3 Admin]:';
  playerTerminal.addLine(`${prefix} "${quote}"`);

  sceneContext.setOpponentSpeaking(true);

  for (let i = 0; i < quote.length; i++) {
    if (myToken !== speechToken) return;
    subtitleText.textContent = `"${quote.slice(0, i + 1)}"`;
    if (quote[i] !== ' ' && i % 2 === 0) {
      soundFX.playVoiceBlip(botOS);
    }
    await new Promise(r => setTimeout(r, 24));
  }

  sceneContext.setOpponentSpeaking(false);

  subtitleTimer = window.setTimeout(() => {
    if (myToken === speechToken) {
      opponentSubtitle.style.display = 'none';
    }
  }, holdMs);
}

function hideOpponentTaunt() {
  speechToken++;
  sceneContext.setOpponentSpeaking(false);
  opponentSubtitle.style.display = 'none';
}

function applyOSConfiguration() {
  if (playerOS === 'linux') {
    playerTerminal.configure({
      bgColor: '#061308',
      textColor: '#33ff66',
      promptPrefix: 'player@archlinux:~$ ',
      osType: 'linux'
    });
    botTerminal.configure({
      bgColor: '#06111e',
      textColor: '#00a4ef',
      promptPrefix: 'C:\\Users\\Administrator> ',
      osType: 'windows'
    });

    telemetryPlayerName.textContent = 'ARCH LINUX';
    telemetryBotName.textContent = 'WINDOWS 11';
    ledPlayer.className = 'led-dot green';
    ledBot.className = 'led-dot blue';
    btnPullLabel.textContent = '[ EXECUTE // SUDO ]';
    if (menuPreviewLabel) {
      menuPreviewLabel.textContent = 'ARCH LINUX VS. CORPORATE SYSADMIN';
    }
  } else {
    playerTerminal.configure({
      bgColor: '#06111e',
      textColor: '#00a4ef',
      promptPrefix: 'PS C:\\Windows\\System32> ',
      osType: 'windows'
    });
    botTerminal.configure({
      bgColor: '#061308',
      textColor: '#33ff66',
      promptPrefix: 'root@archbox:~# ',
      osType: 'linux'
    });

    telemetryPlayerName.textContent = 'WINDOWS 11';
    telemetryBotName.textContent = 'ARCH LINUX';
    ledPlayer.className = 'led-dot blue';
    ledBot.className = 'led-dot green';
    btnPullLabel.textContent = '[ EXECUTE // DEL ]';
    if (menuPreviewLabel) {
      menuPreviewLabel.textContent = 'WINDOWS 11 VS. ROGUE ARCH HACKER';
    }
  }

  sceneContext.configureScene(playerOS);
  initTerminals();
}

/**
 * Stage 1 Loading: Cold-Boot Hardware POST on Initial Page Load
 */
async function runColdBootPost(): Promise<void> {
  isBooting = true;
  applyOSConfiguration();
  await sceneContext.setMenuCameraMode(true, 0);

  bootLoader.classList.remove('fade-out');
  bootLoader.style.display = 'flex';
  bootBiosTitle.textContent = 'ARBITER-ROM BIOS v2.4 // X86_64 DUAL-BOOT CONTROLLER';
  bootStageTag.textContent = '[POST: COLD_BOOT]';
  bootLogLines.innerHTML = '';

  const steps = [
    { pct: 16, status: 'CHECKING NVRAM & CMOS REGISTERS...', line: 'CMOS Checksum: 0x00A4F2 ... <span class="log-ok">[OK]</span>' },
    { pct: 34, status: 'INITIALIZING 3D VIEWPORT & SHADERS...', line: 'WebGL2 Hardware Pipeline: Dual-CRT + Arbiter Mesh ... <span class="log-ok">[OK]</span>' },
    { pct: 58, status: 'PROBING SERIAL BUS (/DEV/TTYS0 <-> COM3)...', line: 'Serial Link 115200 8N1: Handshake verified ... <span class="log-ok">[OK]</span>' },
    { pct: 82, status: 'SCANNING MASTER BOOT RECORD PARTITIONS...', line: 'Detected: [01] /dev/nvme0n1p2 (ext4) | [02] \\Device\\Harddisk1 (NTFS)' },
    { pct: 100, status: 'ARMING 6-CHAMBER STEPPER CYLINDER...', line: 'Rotary Payload Drum: 1 FATAL / 5 DRY-RUN ... <span class="log-warn">[ARMED]</span>' }
  ];

  for (const s of steps) {
    bootStatusLabel.textContent = s.status;
    bootPercent.textContent = `${s.pct}%`;
    bootBarFill.style.width = `${s.pct}%`;
    const p = document.createElement('div');
    p.innerHTML = s.line;
    bootLogLines.appendChild(p);
    soundFX.playDiskSeek();
    await new Promise(r => setTimeout(r, 260));
  }

  soundFX.playBootBeep(960, 0.08);
  await new Promise(r => setTimeout(r, 220));

  bootLoader.classList.add('fade-out');
  mainMenu.style.display = 'flex';
  await new Promise(r => setTimeout(r, 350));
  bootLoader.style.display = 'none';
  isBooting = false;
}

/**
 * Stage 2 Loading: OS Partition Mount Sequence (Menu -> Duel)
 */
async function runOSMountLoader(): Promise<void> {
  isBooting = true;
  mainMenu.style.display = 'none';
  bootLoader.classList.remove('fade-out');
  bootLoader.style.display = 'flex';
  bootLogLines.innerHTML = '';
  bootBarFill.style.width = '0%';

  const isLinux = playerOS === 'linux';
  bootBiosTitle.textContent = isLinux
    ? 'GNU GRUB VERSION 2.12 // ARCH LINUX X86_64'
    : 'WINDOWS BOOT MANAGER // NTKERNEL 10.0.22631';
  bootStageTag.textContent = isLinux ? '[MOUNT: EXT4]' : '[MOUNT: NTFS]';

  const steps = isLinux
    ? [
        { pct: 25, status: 'LOADING LINUX 6.8.9-ARCH1-1...', line: 'Loading Linux 6.8.9-arch1-1-x86_64 ... <span class="log-ok">[OK]</span>' },
        { pct: 55, status: 'LOADING INITIAL RAMDISK...', line: 'Loading initial ramdisk /boot/initramfs-linux.img ... <span class="log-ok">[OK]</span>' },
        { pct: 85, status: 'MOUNTING /DEV/NVME0N1P2 AS ROOT...', line: 'EXT4-fs (nvme0n1p2): mounted filesystem with ordered data mode ... <span class="log-ok">[OK]</span>' },
        { pct: 100, status: 'ELEVATING SUDOERS & LINKING ARBITER...', line: 'uid=0(root) gid=0(root) — Opponent linked on COM3 ... <span class="log-warn">[READY]</span>' }
      ]
    : [
        { pct: 25, status: 'LOADING WINLOAD.EFI...', line: ' Booting \\Windows\\System32\\winload.efi ... <span class="log-win">[OK]</span>' },
        { pct: 55, status: 'INITIALIZING HAL & NTOSKRNL...', line: 'HAL.dll: Hardware Abstraction Layer initialized ... <span class="log-win">[OK]</span>' },
        { pct: 85, status: 'MOUNTING VOLUME C: (NTFS)...', line: 'NTFS Volume C: mounted with Administrator privileges ... <span class="log-win">[OK]</span>' },
        { pct: 100, status: 'LOCKING ARBITER SERIAL PORT COM3...', line: 'PowerShell 7.4 Elevated — Target Arch rig detected on ttyS0 ... <span class="log-warn">[READY]</span>' }
      ];

  // Start smooth 3D camera swoop from Menu angle into Player Seat in parallel
  const camPromise = sceneContext.setMenuCameraMode(false, 1150);

  for (const s of steps) {
    bootStatusLabel.textContent = s.status;
    bootPercent.textContent = `${s.pct}%`;
    bootBarFill.style.width = `${s.pct}%`;
    const p = document.createElement('div');
    p.innerHTML = s.line;
    bootLogLines.appendChild(p);
    soundFX.playDiskSeek();
    await new Promise(r => setTimeout(r, 220));
  }

  soundFX.playBootBeep(isLinux ? 1040 : 820, 0.08);
  rackmountTelemetry.style.display = 'flex';
  hud.style.display = 'flex';
  resetGame();

  bootLoader.classList.add('fade-out');
  await camPromise;
  await new Promise(r => setTimeout(r, 250));
  bootLoader.style.display = 'none';
  isBooting = false;

  // Trigger opening trash talk from opponent so the duel immediately feels alive!
  deliverOpponentTaunt(botAI.getReactiveTaunt(botOS, 'round_start'), 3200);
}

function resetGame() {
  hideOpponentTaunt();
  engine.reset(true); // keep scores in memory
  initTerminals();
  sceneContext.setOpponentDefeated(false, botOS);
  updateHUD();
}

async function returnToMenu() {
  hideOpponentTaunt();
  rackmountTelemetry.style.display = 'none';
  hud.style.display = 'none';
  sceneContext.setOpponentDefeated(false, botOS);
  engine.reset(false);
  mainMenu.style.display = 'flex';
  await sceneContext.setMenuCameraMode(true, 700);
}

const deathManager = new DeathManager({
  container: app,
  playerTerminal,
  botTerminal,
  soundFX,
  setCameraShake: (intensity) => sceneContext.setCameraShake(intensity),
  onRestart: () => {
    resetGame();
    deliverOpponentTaunt(botAI.getReactiveTaunt(botOS, 'round_start'), 3000);
  },
  onMenu: returnToMenu
});

function updateHUD() {
  const state = engine.getState();

  // Update Scoreboard
  scorePlayer.textContent = String(state.stats.playerWins).padStart(2, '0');
  scoreBot.textContent = String(state.stats.botWins).padStart(2, '0');

  // Update Turn Readout
  turnText.className = 'turn-message';
  if (state.phase === 'player_turn') {
    turnText.textContent = `YOUR TURN — SELECT ACTION (${playerOS === 'linux' ? 'ARCH LINUX' : 'WINDOWS 11'})`;
    btnPull.disabled = false;
    btnSpin.disabled = false;
  } else if (state.phase === 'bot_turn') {
    turnText.textContent = `OPPONENT TURN — ${botOS === 'linux' ? 'ROGUE ARCH HACKER' : 'CORPORATE SYSADMIN'}`;
    turnText.classList.add('bot-active');
    btnPull.disabled = true;
    btnSpin.disabled = true;
  } else {
    turnText.textContent = 'ARBITER RESOLVING DISCHARGE...';
    turnText.classList.add('resolving');
    btnPull.disabled = true;
    btnSpin.disabled = true;
  }

  // Update 6 Chamber Bays Matrix
  chamberBays.forEach((bay, idx) => {
    const bayState = bay.querySelector('.bay-state') as HTMLElement;
    bay.classList.toggle('active', idx === state.currentChamber);
    bay.classList.toggle('checked', state.chamberHistory[idx]);

    if (idx === state.currentChamber) {
      if (bayState) bayState.textContent = 'ARMED';
    } else if (state.chamberHistory[idx]) {
      if (bayState) bayState.textContent = 'CLEAN';
    } else {
      if (bayState) bayState.textContent = 'READY';
    }
  });
}

async function handleAction(actor: 'player' | 'bot', action: ActionType) {
  btnPull.disabled = true;
  btnSpin.disabled = true;

  const terminal = actor === 'player' ? playerTerminal : botTerminal;

  // 1. Cinematic Zoom-in on the Dual-Boot Arbiter Console
  await sceneContext.zoomConsole(true, 450);

  if (action === 'spin') {
    terminal.addLine(`[ACTION] Re-indexing rotary payload dial...`);
    if (actor === 'bot') {
      playerTerminal.addLine(`[ARBITER] Opponent spun the rotary payload dial.`);
    }
    soundFX.playSpin();
    await sceneContext.spinRevolver();
  }

  // 2. Animate Hand & Drive Placement / Switch Slam
  if (actor === 'player') {
    const actionDesc = playerOS === 'linux'
      ? 'Docking OS payload drive & arming SUDO...'
      : 'Mounting FATAL volume drive & executing DEL...';
    terminal.addLine(`[ACTION] ${actionDesc}`);
    soundFX.playDriveInsert();
    await sceneContext.animatePlayerAction();
  } else {
    const botDesc = botOS === 'linux'
      ? 'Rogue Arch hacker striking EXECUTE...'
      : 'Corporate SysAdmin striking EXECUTE...';
    terminal.addLine(`[ACTION] ${botDesc}`);
    playerTerminal.addLine(`[ARBITER] ${botDesc}`);
    await sceneContext.aimRevolver('bot');
    await sceneContext.clickHammer();
  }

  const result = engine.executeAction(action);

  if (result.isBullet) {
    hideOpponentTaunt();
    terminal.addLine(`*BOOM!* [FATAL DISCHARGE]: Slot #${result.chamber + 1} EXECUTED!`);
    playerTerminal.addLine(`*BOOM!* [FATAL DISCHARGE]: Slot #${result.chamber + 1} EXECUTED!`);
    sceneContext.setCameraShake(0.18);
    updateHUD();

    // Trigger visual switch depression & electrical spark flash
    await sceneContext.fireRecoil();

    if (actor === 'player') {
      await sceneContext.retractPlayerArm();
    } else {
      sceneContext.aimRevolver('center');
    }

    await new Promise(r => setTimeout(r, 600));
    await sceneContext.zoomConsole(false, 600);

    // Trigger OS Death sequence according to victim
    if (actor === 'player') {
      if (playerOS === 'linux') {
        await deathManager.triggerLinuxDeath('player');
      } else {
        await deathManager.triggerWindowsDeath('player');
      }
    } else {
      sceneContext.setOpponentDefeated(true, botOS);
      if (botOS === 'linux') {
        await deathManager.triggerLinuxDeath('bot');
      } else {
        await deathManager.triggerWindowsDeath('bot');
      }
    }
  } else {
    // Safe execution: tactile mechanical switch click & dry-run log
    soundFX.playEmptyClick();
    await sceneContext.clickHammer();
    terminal.addLine(`*CLACK* [DRY-RUN]: Slot #${result.chamber + 1} safe. Zero byte corruption.`);
    if (actor === 'bot') {
      playerTerminal.addLine(`*CLACK* [DRY-RUN]: Slot #${result.chamber + 1} safe. Opponent survived.`);
    }
    sceneContext.setCameraShake(0.025);
    updateHUD();

    if (actor === 'player') {
      await sceneContext.retractPlayerArm();
    } else {
      await sceneContext.aimRevolver('center');
    }

    await new Promise(r => setTimeout(r, 420));
    // Zoom back out smoothly to full-desk battle view
    await sceneContext.zoomConsole(false, 480);

    // If next is bot, trigger bot turn
    if (engine.getState().phase === 'bot_turn') {
      runBotTurn();
    }
  }
}

async function runBotTurn() {
  updateHUD();
  const state = engine.getState();
  const decision = botAI.decide(state.pullsSurvivedSinceSpin, botOS);

  // Bot delivers guaranteed faction-specific trash talk (subtitle + voice blips + player terminal log)
  await deliverOpponentTaunt(decision.trashTalk, 2200);

  // Bot prints reasoning lines
  botTerminal.addLine(decision.reasoning);

  await new Promise(r => setTimeout(r, 450));
  await handleAction('bot', decision.action);
}

// Menu Selection Helper (Live-swaps 3D scene on click or hover)
function selectPartition(os: 'linux' | 'windows', playSound = true) {
  if (playerOS === os && cardLinux.classList.contains('active') === (os === 'linux')) {
    return;
  }
  playerOS = os;
  botOS = os === 'linux' ? 'windows' : 'linux';
  if (playSound) soundFX.playRelayClick();

  cardLinux.classList.toggle('active', os === 'linux');
  cardWindows.classList.toggle('active', os === 'windows');
  cardLinux.querySelector('.selection-indicator')!.textContent = os === 'linux' ? 'ACTIVE' : 'STANDBY';
  cardWindows.querySelector('.selection-indicator')!.textContent = os === 'windows' ? 'ACTIVE' : 'STANDBY';

  applyOSConfiguration();
}

cardLinux.addEventListener('click', () => selectPartition('linux', true));
cardWindows.addEventListener('click', () => selectPartition('windows', true));
cardLinux.addEventListener('mouseenter', () => selectPartition('linux', true));
cardWindows.addEventListener('mouseenter', () => selectPartition('windows', true));

function launchGame() {
  if (isBooting) return;
  soundFX.playRelayClick();
  runOSMountLoader();
}

btnStartGame.addEventListener('click', launchGame);

window.addEventListener('keydown', (e) => {
  if (!isBooting && mainMenu.style.display !== 'none') {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      launchGame();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      selectPartition('linux', true);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      selectPartition('windows', true);
    }
  }
});

btnPull.addEventListener('click', () => {
  if (engine.getState().phase === 'player_turn') {
    handleAction('player', 'pull');
  }
});

btnSpin.addEventListener('click', () => {
  if (engine.getState().phase === 'player_turn') {
    handleAction('player', 'spin');
  }
});

function animate(time: number) {
  requestAnimationFrame(animate);
  playerTerminal.updateCursor(time);
  botTerminal.updateCursor(time);
  sceneContext.update(time);
}

requestAnimationFrame(animate);
runColdBootPost();
