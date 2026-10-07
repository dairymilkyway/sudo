import { createScene } from './scene';
import { runBulletDistributionTest } from './game';
import { VirtualTerminal } from './terminal';

// Milestone 3: Run console test for 1000 games
const testResult = runBulletDistributionTest(1000);
console.log('--- Kernel Roulette Logic Test (1000 trials) ---');
console.log('Bullet chamber counts [0..5]:', testResult.counts);
console.log('Bullet chamber percentages:', testResult.percentages.map(p => `${p}%`).join(', '));
console.log('Is roughly uniform (within tolerance)?', testResult.isUniform);

const app = document.getElementById('app')!;
const sceneContext = createScene(app);

// Milestone 4: Setup Terminals
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

playerTerminal.addLine('Kernel Roulette v1.0.0 (tty1)');
playerTerminal.addLine('System ready. Revolver loaded with 1 round.');

botTerminal.addLine('Microsoft Windows [Version 10.0.19045.3803]');
botTerminal.addLine('(c) Microsoft Corporation. All rights reserved.');
botTerminal.addLine('WinDefend: Low probability threat detected.');

function animate(time: number) {
  requestAnimationFrame(animate);
  playerTerminal.updateCursor(time);
  botTerminal.updateCursor(time);
  sceneContext.update(time);
}

requestAnimationFrame(animate);

