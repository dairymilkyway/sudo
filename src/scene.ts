import * as THREE from 'three';

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  playerMonitorMesh: THREE.Mesh;
  botMonitorMesh: THREE.Mesh;
  revolverGroup: THREE.Group;
  cylinderMesh: THREE.Mesh;
  update: (time: number) => void;
  setCameraShake: (intensity: number) => void;
  setCameraPush: (progress: number) => void; // 0 to 1
  spinRevolver: () => Promise<void>;
  aimRevolver: (target: 'player' | 'bot' | 'center') => Promise<void>;
}

export function createScene(container: HTMLElement): SceneContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);
  scene.fog = new THREE.FogExp2(0x05070d, 0.15);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50);
  const baseCamPos = new THREE.Vector3(0, 1.45, 1.6);
  const baseCamLook = new THREE.Vector3(0, 1.0, -0.6);
  camera.position.copy(baseCamPos);
  camera.lookAt(baseCamLook);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x1a2238, 1.2);
  scene.add(ambientLight);

  // Desk lamp (warm point light)
  const deskLamp = new THREE.PointLight(0xffb74d, 2.5, 4);
  deskLamp.position.set(-1.1, 1.8, -0.2);
  deskLamp.castShadow = true;
  scene.add(deskLamp);

  // Little lamp shade visual
  const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
  const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.8, 8), lampPostMat);
  lampPost.position.set(-1.1, 1.3, -0.2);
  scene.add(lampPost);
  const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide }));
  lampHead.position.set(-1.1, 1.7, -0.2);
  lampHead.rotation.x = Math.PI * 0.2;
  scene.add(lampHead);

  // Monitor glow lights
  const playerMonitorGlow = new THREE.PointLight(0x33ff66, 1.8, 2.2);
  playerMonitorGlow.position.set(0, 1.15, 0.7);
  scene.add(playerMonitorGlow);

  const botMonitorGlow = new THREE.PointLight(0x0078d7, 2.0, 2.2);
  botMonitorGlow.position.set(0, 1.15, -1.3);
  scene.add(botMonitorGlow);

  // Room geometry (walls and floor)
  const floorGeo = new THREE.PlaneGeometry(10, 10);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x10131a, roughness: 0.9 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshStandardMaterial({ color: 0x0c0f17, roughness: 0.95 }));
  backWall.position.set(0, 3, -3);
  scene.add(backWall);

  // Desk
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x2b1d12, roughness: 0.7 });
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.2), deskMat);
  deskTop.position.set(0, 0.9, -0.3);
  deskTop.receiveShadow = true;
  deskTop.castShadow = true;
  scene.add(deskTop);

  // Desk legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.8 });
  const legGeo = new THREE.BoxGeometry(0.06, 0.9, 0.06);
  const legPositions: [number, number, number][] = [
    [-0.72, 0.45, 0.7],
    [0.72, 0.45, 0.7],
    [-0.72, 0.45, -1.3],
    [0.72, 0.45, -1.3]
  ];
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    scene.add(leg);
  });

  // Stickers on desk
  // Tux sticker (player side: black/white/yellow shapes)
  const tuxGroup = new THREE.Group();
  const tuxBody = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  const tuxBelly = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), new THREE.MeshBasicMaterial({ color: 0xeeeeee }));
  tuxBelly.position.set(0, -0.01, 0.001);
  const tuxBeak = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.02, 3), new THREE.MeshBasicMaterial({ color: 0xffa500 }));
  tuxBeak.position.set(0, 0.015, 0.002);
  tuxBeak.rotation.z = Math.PI;
  tuxGroup.add(tuxBody, tuxBelly, tuxBeak);
  tuxGroup.rotation.x = -Math.PI / 2;
  tuxGroup.rotation.z = 0.2;
  tuxGroup.position.set(-0.35, 0.941, 0.45);
  scene.add(tuxGroup);

  // Windows 4-pane sticker (bot side)
  const winGroup = new THREE.Group();
  const paneSize = 0.03;
  const paneGap = 0.006;
  const colors = [0xf25022, 0x7fba00, 0x00a4ef, 0xffb900]; // Red, Green, Blue, Yellow
  const offsets = [
    [-paneSize / 2 - paneGap / 2, paneSize / 2 + paneGap / 2],
    [paneSize / 2 + paneGap / 2, paneSize / 2 + paneGap / 2],
    [-paneSize / 2 - paneGap / 2, -paneSize / 2 - paneGap / 2],
    [paneSize / 2 + paneGap / 2, -paneSize / 2 - paneGap / 2]
  ];
  colors.forEach((col, idx) => {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(paneSize, paneSize), new THREE.MeshBasicMaterial({ color: col }));
    pane.position.set(offsets[idx][0], offsets[idx][1], 0);
    winGroup.add(pane);
  });
  winGroup.rotation.x = -Math.PI / 2;
  winGroup.rotation.z = Math.PI;
  winGroup.position.set(0.35, 0.941, -1.05);
  scene.add(winGroup);

  // Helper to create CRT Monitor
  function createCRTMonitor(colorTheme: number): { casing: THREE.Group; screen: THREE.Mesh } {
    const monitorGroup = new THREE.Group();
    const caseMat = new THREE.MeshStandardMaterial({ color: 0xd8d2c2, roughness: 0.6 }); // vintage beige CRT
    const caseBackMat = new THREE.MeshStandardMaterial({ color: 0x8a8475, roughness: 0.8 });

    // Base & Stand
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.3), caseMat);
    stand.position.y = 0.02;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.08, 12), caseMat);
    neck.position.y = 0.08;
    monitorGroup.add(stand, neck);

    // CRT Housing
    const frontBezel = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.52, 0.12), caseMat);
    frontBezel.position.set(0, 0.36, 0);
    const crtBack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.44, 0.38), caseBackMat);
    crtBack.position.set(0, 0.36, -0.2);
    monitorGroup.add(frontBezel, crtBack);

    // Screen Mesh (slightly curved look via cylinder or plane)
    const screenGeo = new THREE.PlaneGeometry(0.52, 0.38);
    const screenMat = new THREE.MeshBasicMaterial({ color: colorTheme });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.36, 0.061);
    monitorGroup.add(screen);

    return { casing: monitorGroup, screen };
  }

  // Player Monitor (near side, facing towards camera / -Z)
  const playerCRT = createCRTMonitor(0x0a1a0d);
  playerCRT.casing.position.set(0, 0.94, 0.65);
  // Slightly angled up towards player
  playerCRT.casing.rotation.x = -0.05;
  scene.add(playerCRT.casing);

  // Bot Monitor (far side, facing player / +Z)
  const botCRT = createCRTMonitor(0x081320);
  botCRT.casing.position.set(0, 0.94, -1.25);
  botCRT.casing.rotation.y = Math.PI;
  scene.add(botCRT.casing);

  // Revolver Model (low-poly)
  const revolverGroup = new THREE.Group();
  revolverGroup.position.set(0, 0.98, -0.3);

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3a3f47,
    roughness: 0.35,
    metalness: 0.8
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1f2329,
    roughness: 0.4,
    metalness: 0.7
  });
  const gripWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4a2411,
    roughness: 0.6
  });

  // Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.07), gripWoodMat);
  grip.position.set(0, -0.04, 0.1);
  grip.rotation.x = -0.35;
  revolverGroup.add(grip);

  // Frame / Body
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.14), metalMat);
  frame.position.set(0, 0.02, 0.04);
  revolverGroup.add(frame);

  // Cylinder (chamber) - rotates on SPIN
  const cylinderGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.11, 6);
  cylinderGeo.rotateX(Math.PI / 2);
  const cylinderMesh = new THREE.Mesh(cylinderGeo, darkMetalMat);
  cylinderMesh.position.set(0, 0.03, -0.01);
  revolverGroup.add(cylinderMesh);

  // Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.22, 12), metalMat);
  barrel.position.set(0, 0.045, -0.16);
  barrel.rotation.x = Math.PI / 2;
  revolverGroup.add(barrel);

  // Sight
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.02), metalMat);
  sight.position.set(0, 0.072, -0.25);
  revolverGroup.add(sight);

  // Revolver rests flat on desk initially
  revolverGroup.rotation.z = Math.PI / 2;
  scene.add(revolverGroup);

  // Camera sway and shake state
  let shakeIntensity = 0;
  let pushProgress = 0; // 0 to 1

  function setCameraShake(intensity: number) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
  }

  function setCameraPush(progress: number) {
    pushProgress = THREE.MathUtils.clamp(progress, 0, 1);
  }

  // Revolver animation helpers
  async function spinRevolver(): Promise<void> {
    const startRot = cylinderMesh.rotation.z;
    const extraRot = Math.PI * 8 + Math.random() * Math.PI * 2;
    const duration = 800;
    const startTime = performance.now();

    return new Promise(resolve => {
      function step() {
        const elapsed = performance.now() - startTime;
        const p = Math.min(1, elapsed / duration);
        // ease out cubic
        const ease = 1 - Math.pow(1 - p, 3);
        cylinderMesh.rotation.z = startRot + extraRot * ease;
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      step();
    });
  }

  async function aimRevolver(target: 'player' | 'bot' | 'center'): Promise<void> {
    const startY = revolverGroup.position.y;
    const startRotY = revolverGroup.rotation.y;
    const startRotX = revolverGroup.rotation.x;
    const startRotZ = revolverGroup.rotation.z;

    let targetRotY = 0;
    let targetRotX = 0;
    let targetRotZ = Math.PI / 2; // flat on desk by default
    let targetY = 0.98;

    if (target === 'player') {
      targetRotY = 0; // points +Z towards player
      targetRotX = -0.15;
      targetRotZ = 0;
      targetY = 1.05;
    } else if (target === 'bot') {
      targetRotY = Math.PI; // points -Z towards bot
      targetRotX = 0.15;
      targetRotZ = 0;
      targetY = 1.05;
    } else {
      // center rest
      targetRotY = 0;
      targetRotX = 0;
      targetRotZ = Math.PI / 2;
      targetY = 0.98;
    }

    const duration = 400;
    const startTime = performance.now();

    return new Promise(resolve => {
      function step() {
        const elapsed = performance.now() - startTime;
        const p = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - p, 2);

        revolverGroup.position.y = THREE.MathUtils.lerp(startY, targetY, ease);
        revolverGroup.rotation.y = THREE.MathUtils.lerp(startRotY, targetRotY, ease);
        revolverGroup.rotation.x = THREE.MathUtils.lerp(startRotX, targetRotX, ease);
        revolverGroup.rotation.z = THREE.MathUtils.lerp(startRotZ, targetRotZ, ease);

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      step();
    });
  }

  function update(time: number) {
    // Subtle idle sway
    const swayX = Math.sin(time * 0.0008) * 0.02;
    const swayY = Math.cos(time * 0.0011) * 0.015;

    // Push in towards monitor/revolver
    const pushZ = -pushProgress * 0.45;
    const pushY = -pushProgress * 0.12;

    // Camera shake decay
    let shakeX = 0;
    let shakeY = 0;
    if (shakeIntensity > 0.001) {
      shakeX = (Math.random() - 0.5) * shakeIntensity;
      shakeY = (Math.random() - 0.5) * shakeIntensity;
      shakeIntensity *= 0.9;
    }

    camera.position.set(
      baseCamPos.x + swayX + shakeX,
      baseCamPos.y + swayY + pushY + shakeY,
      baseCamPos.z + pushZ
    );
    camera.lookAt(baseCamLook.x, baseCamLook.y, baseCamLook.z);

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    scene,
    camera,
    renderer,
    playerMonitorMesh: playerCRT.screen,
    botMonitorMesh: botCRT.screen,
    revolverGroup,
    cylinderMesh,
    update,
    setCameraShake,
    setCameraPush,
    spinRevolver,
    aimRevolver
  };
}
