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

// Setup Terminals
const playerTerminal = new VirtualTerminal({
  bgColor: '#061308',
  textColor: '#33ff66',
  promptPrefix: 'player@archlinux:~$ ',
  fontSize: 20
});

const botTerminal = new VirtualTerminal({
  bgColor: '#06111e',
  textColor: '#00a4ef',
  promptPrefix: 'C:\\Users\\Administrator> ',
  fontSize: 20
});

sceneContext.setMonitorTextures(playerTerminal.getTexture(), botTerminal.getTexture());

function initTerminals() {
  playerTerminal.clear();
  playerTerminal.addLine('Kernel Roulette v1.0.0 (tty1)');
  playerTerminal.addLine('System ready. 6 chambers, 1 bullet.');

  botTerminal.clear();
  botTerminal.addLine('Microsoft Windows [Version 10.0.19045.3803]');
  botTerminal.addLine('(c) Microsoft Corporation. All rights reserved.');
  botTerminal.addLine('WinDefend: Low probability threat detected.');
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

  if (action === 'spin') {
    terminal.addLine(`[ACTION] Spinning chamber cylinder...`);
    soundFX.playSpin();
    await sceneContext.spinRevolver();
  }

  // Aim revolver at the active actor
  await sceneContext.aimRevolver(actor);
  sceneContext.setCameraPush(0.5);

  const result = engine.executeAction(action);

  if (result.isBullet) {
    terminal.addLine(`BANG! Bullet fired in chamber #${result.chamber + 1}!`);
    sceneContext.setCameraShake(0.12);
    updateHUD();

    // Trigger visual muzzle flash & weapon recoil kick
    await sceneContext.fireRecoil();

    setTimeout(() => {
      sceneContext.setCameraPush(0);
      sceneContext.aimRevolver('center');
    }, 1200);

    // Trigger OS Death sequence
    if (actor === 'player') {
      await deathManager.triggerLinuxDeath();
    } else {
      sceneContext.setOpponentDefeated(true);
      await deathManager.triggerWindowsDeath();
    }
  } else {
    // Click: empty chamber survived
    soundFX.playEmptyClick();
    await sceneContext.clickHammer();
    terminal.addLine(`*click* (Chamber #${result.chamber + 1} empty).`);
    sceneContext.setCameraShake(0.02);
    updateHUD();

    await new Promise(r => setTimeout(r, 600));
    sceneContext.setCameraPush(0);
    await sceneContext.aimRevolver('center');

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


