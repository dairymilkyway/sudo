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
    playerTerminal.addLine('Press EXECUTE or SPIN & EXEC to advance.');

    botTerminal.addLine('Microsoft Windows [Version 10.0.22631.3296]');
    botTerminal.addLine('(c) Microsoft Corporation. All rights reserved.');
    botTerminal.addLine('WinDefend: Arbiter serial handshake OK on COM3.');
  } else {
    playerTerminal.addLine('Windows PowerShell 7.4.2 [Elevated]');
    playerTerminal.addLine('(c) Microsoft Corporation. Dual-Boot Arbiter connected.');
    playerTerminal.addLine('Volume C: [NTFS] armed against target partition.');
    playerTerminal.addLine('Press EXECUTE or SPIN & EXEC to advance.');

    botTerminal.addLine('Linux archbox 6.8.9-arch1-1-x86_64 (/dev/ttyS0)');
    botTerminal.addLine('Arch Linux rogue session active. Arbiter bus synced.');
    botTerminal.addLine('Payload chamber primed. Watching opponent move.');
  }
}

// Game loop, bot AI, and HUD wiring
const engine = new GameEngine();
const botAI = new BotAI();

// DOM Elements
const mainMenu = document.getElementById('main-menu') as HTMLElement;
const cardLinux = document.getElementById('card-linux') as HTMLElement;
const cardWindows = document.getElementById('card-windows') as HTMLElement;
const btnStartGame = document.getElementById('btn-start-game') as HTMLButtonElement;

const rackmountTelemetry = document.getElementById('rackmount-telemetry') as HTMLElement;
const hud = document.getElementById('hud') as HTMLElement;
const telemetryPlayerName = document.getElementById('telemetry-player-name') as HTMLElement;
const telemetryBotName = document.getElementById('telemetry-bot-name') as HTMLElement;
const ledPlayer = document.getElementById('led-player') as HTMLElement;
const ledBot = document.getElementById('led-bot') as HTMLElement;
const scorePlayer = document.getElementById('score-player') as HTMLElement;
const scoreBot = document.getElementById('score-bot') as HTMLElement;

const turnText = document.getElementById('turn-text') as HTMLElement;
const chamberBays = document.querySelectorAll('#chamber-matrix .chamber-bay');
const btnPull = document.getElementById('btn-pull') as HTMLButtonElement;
const btnSpin = document.getElementById('btn-spin') as HTMLButtonElement;
const btnPullLabel = document.getElementById('btn-pull-label') as HTMLElement;

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
    btnPullLabel.textContent = 'EXECUTE (SUDO)';
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

    telemetryPlayerName.textContent = 'WINDOWS 11 ENT';
    telemetryBotName.textContent = 'ARCH LINUX';
    ledPlayer.className = 'led-dot blue';
    ledBot.className = 'led-dot green';
    btnPullLabel.textContent = 'EXECUTE (DEL)';
  }

  sceneContext.configureScene(playerOS);
}

function resetGame() {
  engine.reset(true); // keep scores in memory
  initTerminals();
  sceneContext.setOpponentDefeated(false, botOS);
  updateHUD();
}

function returnToMenu() {
  mainMenu.style.display = 'flex';
  rackmountTelemetry.style.display = 'none';
  hud.style.display = 'none';
  sceneContext.setOpponentDefeated(false, botOS);
  engine.reset(false);
}

const deathManager = new DeathManager({
  container: app,
  playerTerminal,
  botTerminal,
  soundFX,
  setCameraShake: (intensity) => sceneContext.setCameraShake(intensity),
  onRestart: resetGame,
  onMenu: returnToMenu
});

function updateHUD() {
  const state = engine.getState();

  // Update Scoreboard (7-Segment double digit format)
  scorePlayer.textContent = String(state.stats.playerWins).padStart(2, '0');
  scoreBot.textContent = String(state.stats.botWins).padStart(2, '0');

  // Update Turn Annunciator
  turnText.className = 'annunciator-text';
  if (state.phase === 'player_turn') {
    turnText.textContent = `PRIORITY CONTROL: PLAYER (${playerOS === 'linux' ? 'ARCH LINUX' : 'WINDOWS 11'}) - ARMED`;
    btnPull.disabled = false;
    btnSpin.disabled = false;
  } else if (state.phase === 'bot_turn') {
    turnText.textContent = `ARBITER EVALUATING: OPPONENT (${botOS === 'linux' ? 'ARCH LINUX' : 'WINDOWS 11'}) THINKING...`;
    turnText.classList.add('bot-active');
    btnPull.disabled = true;
    btnSpin.disabled = true;
  } else {
    turnText.textContent = 'ARBITER RESOLVING HARDWARE DISCHARGE...';
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
      ? 'Rogue Arch hacker reaching for EXECUTE...'
      : 'Corporate SysAdmin reaching for EXECUTE...';
    terminal.addLine(`[ACTION] ${botDesc}`);
    await sceneContext.aimRevolver('bot');
    await sceneContext.clickHammer();
  }

  const result = engine.executeAction(action);

  if (result.isBullet) {
    terminal.addLine(`*BOOM!* [FATAL DISCHARGE]: Slot #${result.chamber + 1} EXECUTED!`);
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
    sceneContext.setCameraShake(0.025);
    updateHUD();

    if (actor === 'player') {
      await sceneContext.retractPlayerArm();
    } else {
      await sceneContext.aimRevolver('center');
    }

    await new Promise(r => setTimeout(r, 450));
    // Zoom back out smoothly to full-desk battle view
    await sceneContext.zoomConsole(false, 500);

    // If next is bot, trigger bot turn
    if (engine.getState().phase === 'bot_turn') {
      runBotTurn();
    }
  }
}

async function runBotTurn() {
  updateHUD();
  const state = engine.getState();
  const decision = botAI.decide(state.pullsSurvivedSinceSpin);

  // Fake bot thinking delay
  await new Promise(r => setTimeout(r, decision.delayMs));

  // Bot prints reasoning lines
  botTerminal.addLine(decision.reasoning);

  // Optional bot trash talk
  if (decision.trashTalk) {
    botTerminal.addLine(`"${decision.trashTalk}"`);
  }

  await new Promise(r => setTimeout(r, 500));
  await handleAction('bot', decision.action);
}

// Menu and Interaction Wiring
cardLinux.addEventListener('click', () => {
  playerOS = 'linux';
  botOS = 'windows';
  soundFX.playRelayClick();
  cardLinux.classList.add('active');
  cardWindows.classList.remove('active');
});

cardWindows.addEventListener('click', () => {
  playerOS = 'windows';
  botOS = 'linux';
  soundFX.playRelayClick();
  cardWindows.classList.add('active');
  cardLinux.classList.remove('active');
});

function launchGame() {
  soundFX.playRelayClick();
  mainMenu.style.display = 'none';
  rackmountTelemetry.style.display = 'flex';
  hud.style.display = 'flex';

  applyOSConfiguration();
  resetGame();
}

btnStartGame.addEventListener('click', launchGame);

window.addEventListener('keydown', (e) => {
  if (mainMenu.style.display !== 'none') {
    if (e.key === ' ' || e.key === 'Enter') {
      launchGame();
    } else if (e.key === 'ArrowLeft') {
      cardLinux.click();
    } else if (e.key === 'ArrowRight') {
      cardWindows.click();
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
