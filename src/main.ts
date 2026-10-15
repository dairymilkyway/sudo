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
  playerTerminal.addLine('Dual-Boot Arbiter online (/dev/ttyS0)');
  playerTerminal.addLine('System ready: 6 slots armed, 1 fatal root payload.');
  playerTerminal.addLine('Click EXECUTE or SPIN & EXEC to advance.');

  botTerminal.clear();
  botTerminal.addLine('Microsoft Windows [Version 10.0.19045.3803]');
  botTerminal.addLine('(c) Microsoft Corporation. All rights reserved.');
  botTerminal.addLine('WinDefend: Dual-Boot Arbiter connected on COM3.');
}

initTerminals();

// Game loop, bot AI, and HUD wiring
const engine = new GameEngine();
const botAI = new BotAI();

const btnPull = document.getElementById('btn-pull') as HTMLButtonElement;
const btnSpin = document.getElementById('btn-spin') as HTMLButtonElement;
const turnIndicator = document.getElementById('turn-indicator') as HTMLElement;
const chamberSlots = document.querySelectorAll('.chamber-slots .slot');
const scorePlayer = document.getElementById('score-player') as HTMLElement;
const scoreBot = document.getElementById('score-bot') as HTMLElement;

function resetGame() {
  engine.reset(true); // keep scores in memory
  initTerminals();
  sceneContext.setOpponentDefeated(false);
  updateHUD();
}

const deathManager = new DeathManager({
  container: app,
  playerTerminal,
  botTerminal,
  soundFX,
  setCameraShake: (intensity) => sceneContext.setCameraShake(intensity),
  onRestart: resetGame
});

function updateHUD() {
  const state = engine.getState();

  // Update Scoreboard
  scorePlayer.textContent = String(state.stats.playerWins);
  scoreBot.textContent = String(state.stats.botWins);

  // Update Turn Indicator
  if (state.phase === 'player_turn') {
    turnIndicator.innerHTML = 'CURRENT TURN: <span class="player-turn">PLAYER (LINUX)</span>';
    btnPull.disabled = false;
    btnSpin.disabled = false;
  } else if (state.phase === 'bot_turn') {
    turnIndicator.innerHTML = 'CURRENT TURN: <span class="bot-turn">BOT (WINDOWS)</span>';
    btnPull.disabled = true;
    btnSpin.disabled = true;
  } else {
    turnIndicator.innerHTML = 'CURRENT TURN: <span>RESOLVING...</span>';
    btnPull.disabled = true;
    btnSpin.disabled = true;
  }

  // Update Chamber Indicators
  chamberSlots.forEach((slot, idx) => {
    slot.classList.toggle('current', idx === state.currentChamber);
    slot.classList.toggle('checked', state.chamberHistory[idx]);
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
    terminal.addLine(`[ACTION] Docking OS payload drive & arming SUDO...`);
    soundFX.playDriveInsert();
    await sceneContext.animatePlayerAction();
  } else {
    terminal.addLine(`[ACTION] Windows technician reaching for EXEC...`);
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

    // Trigger OS Death sequence
    if (actor === 'player') {
      await deathManager.triggerLinuxDeath();
    } else {
      sceneContext.setOpponentDefeated(true);
      await deathManager.triggerWindowsDeath();
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

updateHUD();


function animate(time: number) {
  requestAnimationFrame(animate);
  playerTerminal.updateCursor(time);
  botTerminal.updateCursor(time);
  sceneContext.update(time);
}

requestAnimationFrame(animate);


