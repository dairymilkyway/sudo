import { createScene } from './scene';

const app = document.getElementById('app')!;
const sceneContext = createScene(app);

function animate(time: number) {
  requestAnimationFrame(animate);
  sceneContext.update(time);
}

requestAnimationFrame(animate);
