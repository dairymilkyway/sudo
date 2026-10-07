import { createScene } from './scene';
import { runBulletDistributionTest } from './game';

// Milestone 3: Run console test for 1000 games
const testResult = runBulletDistributionTest(1000);
console.log('--- Kernel Roulette Logic Test (1000 trials) ---');
console.log('Bullet chamber counts [0..5]:', testResult.counts);
console.log('Bullet chamber percentages:', testResult.percentages.map(p => `${p}%`).join(', '));
console.log('Is roughly uniform (within tolerance)?', testResult.isUniform);

const app = document.getElementById('app')!;
const sceneContext = createScene(app);


function animate(time: number) {
  requestAnimationFrame(animate);
  sceneContext.update(time);
}

requestAnimationFrame(animate);
