import * as THREE from 'three';

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  playerMonitorMesh: THREE.Mesh;
  botMonitorMesh: THREE.Mesh;
  setMonitorTextures: (playerTex: THREE.Texture, botTex: THREE.Texture) => void;
  revolverGroup: THREE.Group;
  cylinderMesh: THREE.Mesh;
  update: (time: number) => void;
  setCameraShake: (intensity: number) => void;
  setCameraPush: (progress: number) => void; // 0 to 1
  spinRevolver: () => Promise<void>;
  aimRevolver: (target: 'player' | 'bot' | 'center') => Promise<void>;
  fireRecoil: () => Promise<void>;
  clickHammer: () => Promise<void>;
  setOpponentDefeated: (defeated: boolean, botOS?: 'windows' | 'linux') => void;
  zoomConsole: (zoomIn: boolean, durationMs?: number) => Promise<void>;
  animatePlayerAction: () => Promise<void>;
  retractPlayerArm: () => Promise<void>;
  configureScene: (playerOS: 'linux' | 'windows') => void;
}

export function createScene(container: HTMLElement): SceneContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);
  scene.fog = new THREE.FogExp2(0x05070d, 0.04);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50);
  const baseCamPos = new THREE.Vector3(0, 1.44, 1.42);
  const baseCamLook = new THREE.Vector3(0, 1.26, -0.85);
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

  // Helper to create sleek monitor with maximized screen real estate ("more screen")
  function createWidescreenMonitor(colorTheme: number): { casing: THREE.Group; screen: THREE.Mesh } {
    const monitorGroup = new THREE.Group();
    const caseMat = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.5, metalness: 0.3 });
    const caseBackMat = new THREE.MeshStandardMaterial({ color: 0x0d1016, roughness: 0.7, metalness: 0.2 });

    // Sleek stand base
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.22), caseMat);
    stand.position.y = 0.01;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.16, 12), caseMat);
    neck.position.set(0, 0.09, -0.04);
    monitorGroup.add(stand, neck);

    // Slim-bezel Monitor Housing (width 0.80, height 0.52, depth 0.035)
    const frontBezel = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.52, 0.035), caseMat);
    frontBezel.position.set(0, 0.36, 0);
    const backHousing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.44, 0.12), caseBackMat);
    backHousing.position.set(0, 0.36, -0.07);
    monitorGroup.add(frontBezel, backHousing);

    // Huge Screen Mesh (0.77 x 0.49) covering ~95% of front face ("more screen")
    const screenGeo = new THREE.PlaneGeometry(0.77, 0.49);
    const screenMat = new THREE.MeshBasicMaterial({ color: colorTheme });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.36, 0.018);
    monitorGroup.add(screen);

    // Subtle power indicator LED at bottom right
    const ledMat = new THREE.MeshBasicMaterial({ color: colorTheme === 0x0a1a0d ? 0x33ff66 : 0x00a4ef });
    const powerLed = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.002), ledMat);
    powerLed.position.set(0.37, 0.11, 0.018);
    monitorGroup.add(powerLed);

    return { casing: monitorGroup, screen };
  }

  // Player Monitor (near side, offset to left so desk, opponent, and revolver are visible)
  const playerCRT = createWidescreenMonitor(0x0a1a0d);
  playerCRT.casing.position.set(-0.58, 0.94, 0.45);
  playerCRT.casing.rotation.y = 0.36;
  playerCRT.casing.rotation.x = -0.04;
  scene.add(playerCRT.casing);

  // Bot Monitor (far side, offset to right)
  const botCRT = createWidescreenMonitor(0x081320);
  botCRT.casing.position.set(0.62, 0.94, -0.95);
  botCRT.casing.rotation.y = Math.PI - 0.36;
  scene.add(botCRT.casing);

  // --- Keyboard & Mouse per Person ---
  function createPeripheralSet(isBot: boolean, themeColor: string) {
    const group = new THREE.Group();

    // 1. Keyboard Canvas Texture (512x256)
    const kbCanvas = document.createElement('canvas');
    kbCanvas.width = 512;
    kbCanvas.height = 256;
    const kCtx = kbCanvas.getContext('2d')!;

    // Chassis
    kCtx.fillStyle = '#11141c';
    kCtx.fillRect(0, 0, 512, 256);

    // Keybed RGB underglow
    kCtx.fillStyle = themeColor;
    kCtx.globalAlpha = 0.28;
    kCtx.fillRect(16, 16, 480, 224);
    kCtx.globalAlpha = 1.0;

    // Draw mechanical keycap rows
    const rowCount = 5;
    const colCount = 14;
    const startX = 22;
    const startY = 22;
    const keyW = 28;
    const keyH = 34;
    const gap = 5;

    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const kx = startX + c * (keyW + gap);
        const ky = startY + r * (keyH + gap);

        // Skip spacebar slot
        if (r === 4 && c >= 4 && c <= 8) continue;

        // Keycap base
        kCtx.fillStyle = '#1e2430';
        kCtx.fillRect(kx, ky, keyW, keyH);

        // Keycap top bevel
        kCtx.fillStyle = '#293140';
        kCtx.fillRect(kx + 2, ky + 2, keyW - 4, keyH - 4);
      }
    }

    // Spacebar
    const sbX = startX + 4 * (keyW + gap);
    const sbY = startY + 4 * (keyH + gap);
    const sbW = 5 * (keyW + gap) - gap;
    kCtx.fillStyle = '#1e2430';
    kCtx.fillRect(sbX, sbY, sbW, keyH);
    kCtx.fillStyle = '#293140';
    kCtx.fillRect(sbX + 2, sbY + 2, sbW - 4, keyH - 4);

    // Enter key with theme color accent
    const enterX = startX + 12 * (keyW + gap);
    const enterY = startY + 2 * (keyH + gap);
    const enterW = keyW * 2 + gap;
    kCtx.fillStyle = themeColor;
    kCtx.fillRect(enterX, enterY, enterW, keyH);

    // OS Super Key (bottom-left)
    const osKeyX = startX + 2 * (keyW + gap);
    const osKeyY = startY + 4 * (keyH + gap);
    if (isBot) {
      // Windows 4-pane icon
      kCtx.fillStyle = '#00a4ef';
      const pw = 5;
      kCtx.fillRect(osKeyX + 8, osKeyY + 11, pw, pw);
      kCtx.fillRect(osKeyX + 15, osKeyY + 11, pw, pw);
      kCtx.fillRect(osKeyX + 8, osKeyY + 18, pw, pw);
      kCtx.fillRect(osKeyX + 15, osKeyY + 18, pw, pw);
    } else {
      // Linux Tux icon
      kCtx.fillStyle = '#33ff66';
      kCtx.beginPath();
      kCtx.arc(osKeyX + 14, osKeyY + 17, 6, 0, Math.PI * 2);
      kCtx.fill();
    }

    const kbTexture = new THREE.CanvasTexture(kbCanvas);

    // Keyboard 3D Mesh
    const kbGeo = new THREE.BoxGeometry(0.38, 0.02, 0.15);
    const kbMat = [
      new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: kbTexture, roughness: 0.55 }), // Top face with keycaps
      new THREE.MeshStandardMaterial({ color: 0x10131a, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.8 })
    ];
    const keyboardMesh = new THREE.Mesh(kbGeo, kbMat);
    keyboardMesh.castShadow = true;
    keyboardMesh.receiveShadow = true;
    group.add(keyboardMesh);

    // 2. Mousepad
    const padCanvas = document.createElement('canvas');
    padCanvas.width = 256;
    padCanvas.height = 256;
    const pCtx = padCanvas.getContext('2d')!;
    pCtx.fillStyle = '#0d1016';
    pCtx.fillRect(0, 0, 256, 256);
    // Stitched edge
    pCtx.strokeStyle = themeColor;
    pCtx.lineWidth = 10;
    pCtx.strokeRect(5, 5, 246, 246);
    const padTexture = new THREE.CanvasTexture(padCanvas);

    const mousepad = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 0.003, 0.22),
      new THREE.MeshStandardMaterial({ map: padTexture, roughness: 0.85 })
    );
    mousepad.position.set(0.26, -0.008, 0);
    mousepad.receiveShadow = true;
    group.add(mousepad);

    // 3. Ergonomic Gaming Mouse
    const mouseGroup = new THREE.Group();
    mouseGroup.position.set(0.26, 0.008, 0);

    const mouseBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.062, 0.024, 0.105),
      new THREE.MeshStandardMaterial({ color: 0x151922, roughness: 0.45, metalness: 0.25 })
    );
    mouseBody.castShadow = true;
    mouseGroup.add(mouseBody);

    // Scroll wheel
    const wheel = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.012, 0.024),
      new THREE.MeshStandardMaterial({ color: 0x080a0f, roughness: 0.9 })
    );
    wheel.position.set(0, 0.013, -0.022);
    mouseGroup.add(wheel);

    // Glowing RGB strip
    const glowStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.004, 0.008),
      new THREE.MeshBasicMaterial({ color: themeColor === '#33ff66' ? 0x33ff66 : 0x00a4ef })
    );
    glowStrip.position.set(0, 0.013, 0.025);
    mouseGroup.add(glowStrip);

    group.add(mouseGroup);

    return group;
  }

  // Player Keyboard & Mouse Set (near side)
  const playerPeripherals = createPeripheralSet(false, '#33ff66');
  playerPeripherals.position.set(-0.16, 0.951, 0.48);
  playerPeripherals.rotation.y = 0.08;
  scene.add(playerPeripherals);

  // Bot Keyboard & Mouse Set (far side, facing opponent)
  const botPeripherals = createPeripheralSet(true, '#00a4ef');
  botPeripherals.position.set(0.06, 0.951, -0.72);
  botPeripherals.rotation.y = Math.PI - 0.12;
  scene.add(botPeripherals);

  // --- Procedural Canvas Textures for Opponent ---
  function createOpponentTextures() {
    // 1. Face Canvas (512x512)
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 512;
    faceCanvas.height = 512;
    const fCtx = faceCanvas.getContext('2d')!;

    let currentFaceOS: 'windows' | 'linux' = 'windows';

    function drawFace(eyesClosed: boolean, osType: 'windows' | 'linux' = currentFaceOS) {
      currentFaceOS = osType;
      fCtx.clearRect(0, 0, 512, 512);

      // Warm natural skin base gradient
      const skinGrad = fCtx.createRadialGradient(256, 250, 40, 256, 260, 240);
      skinGrad.addColorStop(0, '#f5d5be');
      skinGrad.addColorStop(0.65, '#e4b695');
      skinGrad.addColorStop(1, '#cb9674');
      fCtx.fillStyle = skinGrad;
      fCtx.fillRect(0, 0, 512, 512);

      // Cheekbones and temple shading
      fCtx.fillStyle = 'rgba(185, 105, 65, 0.16)';
      fCtx.beginPath();
      fCtx.arc(140, 310, 65, 0, Math.PI * 2);
      fCtx.arc(372, 310, 65, 0, Math.PI * 2);
      fCtx.fill();

      // Subtle jaw contour
      fCtx.fillStyle = 'rgba(140, 80, 50, 0.2)';
      fCtx.beginPath();
      fCtx.ellipse(256, 420, 160, 70, 0, 0, Math.PI);
      fCtx.fill();

      // 5 o'clock shadow / stubble (heavier for hacker)
      fCtx.fillStyle = osType === 'linux' ? 'rgba(40, 35, 30, 0.28)' : 'rgba(60, 45, 35, 0.18)';
      fCtx.beginPath();
      fCtx.ellipse(256, 385, 120, 85, 0, 0, Math.PI);
      fCtx.fill();

      // Eyebrows
      fCtx.strokeStyle = '#2d1c10';
      fCtx.lineWidth = osType === 'linux' ? 12 : 10;
      fCtx.lineCap = 'round';
      // Left eyebrow
      fCtx.beginPath();
      fCtx.moveTo(135, 185);
      fCtx.quadraticCurveTo(185, 168, 230, 182);
      fCtx.stroke();
      // Right eyebrow
      fCtx.beginPath();
      fCtx.moveTo(282, 182);
      fCtx.quadraticCurveTo(327, 168, 377, 185);
      fCtx.stroke();

      // Eyes
      const eyeY = 216;
      const leftEyeX = 184;
      const rightEyeX = 328;

      if (eyesClosed) {
        // Closed eyelids with lashes
        fCtx.strokeStyle = '#3d2415';
        fCtx.lineWidth = 5;
        fCtx.lineCap = 'round';
        fCtx.beginPath();
        fCtx.arc(leftEyeX, eyeY - 2, 23, 0.25, Math.PI - 0.25);
        fCtx.stroke();
        fCtx.beginPath();
        fCtx.arc(rightEyeX, eyeY - 2, 23, 0.25, Math.PI - 0.25);
        fCtx.stroke();
      } else {
        [leftEyeX, rightEyeX].forEach(x => {
          fCtx.save();
          fCtx.beginPath();
          fCtx.ellipse(x, eyeY, 26, 17, 0, 0, Math.PI * 2);
          fCtx.clip();

          // Sclera (eye white)
          fCtx.fillStyle = '#f6f7fa';
          fCtx.fill();

          // Iris (Striking Windows blue or Hacker emerald green)
          const irisGrad = fCtx.createRadialGradient(x, eyeY, 2, x, eyeY, 13);
          if (osType === 'windows') {
            irisGrad.addColorStop(0, '#00a4ef');
            irisGrad.addColorStop(0.7, '#0078d7');
            irisGrad.addColorStop(1, '#003a68');
          } else {
            irisGrad.addColorStop(0, '#4ade80');
            irisGrad.addColorStop(0.7, '#16a34a');
            irisGrad.addColorStop(1, '#052e16');
          }
          fCtx.fillStyle = irisGrad;
          fCtx.beginPath();
          fCtx.arc(x, eyeY, 13, 0, Math.PI * 2);
          fCtx.fill();

          // Pupil
          fCtx.fillStyle = '#080c10';
          fCtx.beginPath();
          fCtx.arc(x, eyeY, 6, 0, Math.PI * 2);
          fCtx.fill();

          // Catchlight reflection glint
          fCtx.fillStyle = '#ffffff';
          fCtx.beginPath();
          fCtx.arc(x - 3, eyeY - 4, 3.5, 0, Math.PI * 2);
          fCtx.fill();

          fCtx.restore();

          // Upper eyelid line
          fCtx.strokeStyle = '#2b170c';
          fCtx.lineWidth = 4;
          fCtx.beginPath();
          fCtx.ellipse(x, eyeY, 27, 17, 0, Math.PI + 0.2, -0.2);
          fCtx.stroke();
        });
      }

      // Nose bridge
      fCtx.strokeStyle = 'rgba(140, 80, 45, 0.5)';
      fCtx.lineWidth = 4.5;
      fCtx.beginPath();
      fCtx.moveTo(250, 205);
      fCtx.lineTo(246, 274);
      fCtx.lineTo(268, 278);
      fCtx.stroke();

      // Nostrils
      fCtx.fillStyle = '#65361b';
      fCtx.beginPath();
      fCtx.arc(238, 282, 4.5, 0, Math.PI * 2);
      fCtx.arc(274, 282, 4.5, 0, Math.PI * 2);
      fCtx.fill();

      // Lips
      fCtx.fillStyle = '#a6594b';
      fCtx.beginPath();
      fCtx.ellipse(256, 350, 38, 13, 0, 0, Math.PI * 2);
      fCtx.fill();

      // Lip center line (tense determined smirk)
      fCtx.strokeStyle = '#5c221a';
      fCtx.lineWidth = 3.5;
      fCtx.beginPath();
      fCtx.moveTo(220, 350);
      fCtx.quadraticCurveTo(256, 353, 292, 348);
      fCtx.stroke();

      // Forehead hairline
      fCtx.fillStyle = '#22140a';
      fCtx.beginPath();
      fCtx.moveTo(0, 0);
      fCtx.lineTo(512, 0);
      if (osType === 'windows') {
        fCtx.lineTo(512, 85);
        fCtx.quadraticCurveTo(380, 95, 300, 75);
        fCtx.quadraticCurveTo(240, 110, 150, 90);
        fCtx.lineTo(0, 85);
      } else {
        // Messy textured hacker fringe
        fCtx.lineTo(512, 115);
        fCtx.lineTo(440, 95);
        fCtx.lineTo(390, 130);
        fCtx.lineTo(330, 90);
        fCtx.lineTo(280, 135);
        fCtx.lineTo(230, 92);
        fCtx.lineTo(170, 140);
        fCtx.lineTo(120, 95);
        fCtx.lineTo(60, 125);
        fCtx.lineTo(0, 100);
      }
      fCtx.closePath();
      fCtx.fill();
    }

    drawFace(false, 'windows');
    const faceTexture = new THREE.CanvasTexture(faceCanvas);

    // 2. Suit / Hoodie Torso Canvas (512x512)
    const suitCanvas = document.createElement('canvas');
    suitCanvas.width = 512;
    suitCanvas.height = 512;
    const sCtx = suitCanvas.getContext('2d')!;

    // 3. Hand Canvas (256x256)
    const handCanvas = document.createElement('canvas');
    handCanvas.width = 256;
    handCanvas.height = 256;
    const hCtx = handCanvas.getContext('2d')!;

    function drawOpponentOutfit(osType: 'windows' | 'linux') {
      sCtx.clearRect(0, 0, 512, 512);

      if (osType === 'windows') {
        // Charcoal suit jacket base
        sCtx.fillStyle = '#1c222d';
        sCtx.fillRect(0, 0, 512, 512);

        // Fine fabric texture
        sCtx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < 512; i += 4) {
          sCtx.fillRect(i, 0, 2, 512);
          sCtx.fillRect(0, i, 512, 2);
        }

        // White collared shirt (V-neck opening)
        sCtx.fillStyle = '#edf2f7';
        sCtx.beginPath();
        sCtx.moveTo(200, 0);
        sCtx.lineTo(312, 0);
        sCtx.lineTo(256, 240);
        sCtx.closePath();
        sCtx.fill();

        // Shirt collar flaps
        sCtx.fillStyle = '#ffffff';
        sCtx.beginPath();
        sCtx.moveTo(200, 0);
        sCtx.lineTo(240, 80);
        sCtx.lineTo(215, 85);
        sCtx.closePath();
        sCtx.fill();
        sCtx.beginPath();
        sCtx.moveTo(312, 0);
        sCtx.lineTo(272, 80);
        sCtx.lineTo(297, 85);
        sCtx.closePath();
        sCtx.fill();

        // Tie (Windows blue #0078d7 with sheen)
        sCtx.fillStyle = '#0078d7';
        sCtx.beginPath();
        sCtx.moveTo(244, 45);
        sCtx.lineTo(268, 45);
        sCtx.lineTo(278, 380);
        sCtx.lineTo(256, 420);
        sCtx.lineTo(234, 380);
        sCtx.closePath();
        sCtx.fill();

        // Tie knot
        sCtx.fillStyle = '#0063b1';
        sCtx.beginPath();
        sCtx.moveTo(242, 38);
        sCtx.lineTo(270, 38);
        sCtx.lineTo(262, 70);
        sCtx.lineTo(250, 70);
        sCtx.closePath();
        sCtx.fill();

        // Lapels
        sCtx.fillStyle = '#151b24';
        sCtx.beginPath();
        sCtx.moveTo(130, 0);
        sCtx.lineTo(200, 0);
        sCtx.lineTo(245, 250);
        sCtx.lineTo(160, 240);
        sCtx.closePath();
        sCtx.fill();

        sCtx.beginPath();
        sCtx.moveTo(382, 0);
        sCtx.lineTo(312, 0);
        sCtx.lineTo(267, 250);
        sCtx.lineTo(352, 240);
        sCtx.closePath();
        sCtx.fill();

        // Lapel stitch edges
        sCtx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        sCtx.lineWidth = 2;
        sCtx.beginPath();
        sCtx.moveTo(200, 0);
        sCtx.lineTo(245, 250);
        sCtx.moveTo(312, 0);
        sCtx.lineTo(267, 250);
        sCtx.stroke();

        // Windows 4-pane logo enamel lapel pin
        const pinX = 180;
        const pinY = 160;
        const pSize = 11;
        const pGap = 3;
        sCtx.fillStyle = '#f25022';
        sCtx.fillRect(pinX - pSize - pGap / 2, pinY - pSize - pGap / 2, pSize, pSize);
        sCtx.fillStyle = '#7fba00';
        sCtx.fillRect(pinX + pGap / 2, pinY - pSize - pGap / 2, pSize, pSize);
        sCtx.fillStyle = '#00a4ef';
        sCtx.fillRect(pinX - pSize - pGap / 2, pinY + pGap / 2, pSize, pSize);
        sCtx.fillStyle = '#ffb900';
        sCtx.fillRect(pinX + pGap / 2, pinY + pGap / 2, pSize, pSize);

        // Suit buttons
        sCtx.fillStyle = '#0d1016';
        sCtx.strokeStyle = '#333e50';
        sCtx.lineWidth = 2;
        [290, 360, 430].forEach(y => {
          sCtx.beginPath();
          sCtx.arc(256, y, 7, 0, Math.PI * 2);
          sCtx.fill();
          sCtx.stroke();
        });

        // Hand sleeve cuff
        hCtx.fillStyle = '#e4b695';
        hCtx.fillRect(0, 0, 256, 256);
        hCtx.fillStyle = '#1c222d';
        hCtx.fillRect(0, 180, 256, 76);
        hCtx.fillStyle = '#ffffff';
        hCtx.fillRect(0, 172, 256, 8);
      } else {
        // Dark Hacker Hoodie base
        sCtx.fillStyle = '#11141a';
        sCtx.fillRect(0, 0, 512, 512);

        // Hoodie texture
        sCtx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 512; i += 3) {
          sCtx.fillRect(i, 0, 1, 512);
          sCtx.fillRect(0, i, 512, 1);
        }

        // Hoodie neckline & hood collar fold
        sCtx.fillStyle = '#191e26';
        sCtx.beginPath();
        sCtx.moveTo(160, 0);
        sCtx.quadraticCurveTo(256, 70, 352, 0);
        sCtx.lineTo(400, 50);
        sCtx.quadraticCurveTo(256, 110, 112, 50);
        sCtx.closePath();
        sCtx.fill();

        // Inner black T-shirt visible in collar
        sCtx.fillStyle = '#0a0c10';
        sCtx.beginPath();
        sCtx.moveTo(200, 0);
        sCtx.quadraticCurveTo(256, 60, 312, 0);
        sCtx.closePath();
        sCtx.fill();

        // Center metal zipper
        sCtx.strokeStyle = '#64748b';
        sCtx.lineWidth = 5;
        sCtx.beginPath();
        sCtx.moveTo(256, 65);
        sCtx.lineTo(256, 512);
        sCtx.stroke();

        // Zipper pull tab
        sCtx.fillStyle = '#94a3b8';
        sCtx.fillRect(251, 80, 10, 18);

        // Hoodie drawstrings (white/grey cord hanging down)
        sCtx.strokeStyle = '#cbd5e1';
        sCtx.lineWidth = 4;
        sCtx.lineCap = 'round';
        sCtx.beginPath();
        sCtx.moveTo(215, 60);
        sCtx.bezierCurveTo(210, 140, 225, 200, 220, 240);
        sCtx.moveTo(297, 60);
        sCtx.bezierCurveTo(302, 140, 287, 200, 292, 240);
        sCtx.stroke();

        // Drawstring metal aglets
        sCtx.fillStyle = '#94a3b8';
        sCtx.fillRect(217, 240, 6, 14);
        sCtx.fillRect(289, 240, 6, 14);

        // Kangaroo pocket curve seams
        sCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        sCtx.lineWidth = 3;
        sCtx.beginPath();
        sCtx.moveTo(90, 480);
        sCtx.lineTo(130, 350);
        sCtx.lineTo(382, 350);
        sCtx.lineTo(422, 480);
        sCtx.stroke();

        // Arch Linux / Tux embroidered chest patch (Left breast)
        const patchX = 175;
        const patchY = 165;
        sCtx.fillStyle = '#1793d1'; // Arch cyan blue
        sCtx.beginPath();
        sCtx.arc(patchX, patchY, 24, 0, Math.PI * 2);
        sCtx.fill();
        sCtx.strokeStyle = '#38bdf8';
        sCtx.lineWidth = 2.5;
        sCtx.stroke();

        // Mini Arch triangle inside patch
        sCtx.fillStyle = '#ffffff';
        sCtx.beginPath();
        sCtx.moveTo(patchX, patchY - 14);
        sCtx.lineTo(patchX - 12, patchY + 12);
        sCtx.lineTo(patchX - 4, patchY + 10);
        sCtx.lineTo(patchX, patchY + 2);
        sCtx.lineTo(patchX + 4, patchY + 10);
        sCtx.lineTo(patchX + 12, patchY + 12);
        sCtx.closePath();
        sCtx.fill();

        // Hand sleeve cuff (Dark hoodie ribbing)
        hCtx.fillStyle = '#e4b695';
        hCtx.fillRect(0, 0, 256, 256);
        hCtx.fillStyle = '#11141a';
        hCtx.fillRect(0, 180, 256, 76);
        hCtx.fillStyle = '#1e2430';
        hCtx.fillRect(0, 172, 256, 8);
      }

      // Knuckles and fingernails on hand
      hCtx.strokeStyle = 'rgba(120, 60, 30, 0.4)';
      hCtx.lineWidth = 4;
      [45, 95, 145, 195].forEach(x => {
        hCtx.beginPath();
        hCtx.moveTo(x, 15);
        hCtx.lineTo(x, 150);
        hCtx.stroke();

        hCtx.fillStyle = '#eed3c4';
        hCtx.beginPath();
        hCtx.ellipse(x + 10, 25, 7, 10, 0, 0, Math.PI * 2);
        hCtx.fill();
      });
    }

    drawOpponentOutfit('windows');
    const suitTexture = new THREE.CanvasTexture(suitCanvas);
    const handTexture = new THREE.CanvasTexture(handCanvas);

    // 4. Hair Canvas (256x256)
    const hairCanvas = document.createElement('canvas');
    hairCanvas.width = 256;
    hairCanvas.height = 256;
    const hrCtx = hairCanvas.getContext('2d')!;
    hrCtx.fillStyle = '#22140a';
    hrCtx.fillRect(0, 0, 256, 256);
    hrCtx.strokeStyle = '#3c2415';
    hrCtx.lineWidth = 2.5;
    for (let i = 0; i < 256; i += 6) {
      hrCtx.beginPath();
      hrCtx.moveTo(i, 0);
      hrCtx.lineTo(i + (Math.random() - 0.5) * 20, 256);
      hrCtx.stroke();
    }
    const hairTexture = new THREE.CanvasTexture(hairCanvas);

    return {
      faceTexture,
      drawFace,
      suitTexture,
      drawOpponentOutfit,
      handTexture,
      hairTexture
    };
  }

  const { faceTexture, drawFace, suitTexture, drawOpponentOutfit, handTexture, hairTexture } = createOpponentTextures();

  // 3D Textured Opponent (Windows Corporate Dealer sitting across desk)
  const botOpponentGroup = new THREE.Group();
  botOpponentGroup.position.set(0, 0.88, -1.45);

  const suitMat = new THREE.MeshStandardMaterial({ color: 0x1c222d, roughness: 0.75 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe4b695, roughness: 0.55 });
  const hairMat = new THREE.MeshStandardMaterial({ map: hairTexture, roughness: 0.85 });

  // Torso / Suit Body
  const torsoMaterials = [
    suitMat, // right
    suitMat, // left
    suitMat, // top
    suitMat, // bottom
    new THREE.MeshStandardMaterial({ map: suitTexture, roughness: 0.7 }), // front textured suit
    suitMat  // back
  ];
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.64, 0.32), torsoMaterials);
  torsoMesh.position.y = 0.32;
  torsoMesh.castShadow = true;
  botOpponentGroup.add(torsoMesh);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.14, 12), skinMat);
  neck.position.set(0, 0.68, 0.01);
  botOpponentGroup.add(neck);

  // Head Group (tilts and animates)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.88, 0.02);

  const headMaterials = [
    hairMat, // right
    hairMat, // left
    hairMat, // top
    skinMat, // bottom
    new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.5 }), // front realistic face
    hairMat  // back
  ];
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.28), headMaterials);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // 3D Hair volume on top and sides
  const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.30), hairMat);
  hairTop.position.set(0, 0.16, 0.01);
  const hairBangs = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.08, 0.12), hairMat);
  hairBangs.position.set(0, 0.16, 0.1);
  headGroup.add(hairTop, hairBangs);

  botOpponentGroup.add(headGroup);

  // Arms in suit fabric draped towards keyboard and mouse
  const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.36, 0.14), suitMat);
  leftUpperArm.position.set(0.30, 0.42, 0.05);
  leftUpperArm.rotation.set(0.65, -0.15, 0.1);

  const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.36, 0.14), suitMat);
  rightUpperArm.position.set(-0.30, 0.42, 0.05);
  rightUpperArm.rotation.set(0.65, 0.15, -0.1);

  const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.12), suitMat);
  leftForearm.position.set(0.18, 0.18, 0.44);
  leftForearm.rotation.set(1.30, -0.22, 0);

  const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.12), suitMat);
  rightForearm.position.set(-0.24, 0.18, 0.44);
  rightForearm.rotation.set(1.30, 0.12, 0);

  botOpponentGroup.add(leftUpperArm, rightUpperArm, leftForearm, rightForearm);

  // Hands resting on keyboard (left hand) and mouse (right hand)
  const handMaterials = [
    skinMat,
    skinMat,
    new THREE.MeshStandardMaterial({ map: handTexture, roughness: 0.55 }), // top of hand
    skinMat,
    skinMat,
    skinMat
  ];
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.16), handMaterials);
  leftHand.position.set(0.08, 0.065, 0.72);
  leftHand.rotation.y = -0.12;

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.16), handMaterials);
  rightHand.position.set(-0.20, 0.065, 0.72);
  rightHand.rotation.y = 0.08;
  botOpponentGroup.add(leftHand, rightHand);

  // High-backed Executive Office Chair
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.6 });
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.10, 0.50), chairMat);
  chairSeat.position.set(0, 0.04, -0.05);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.85, 0.10), chairMat);
  chairBack.position.set(0, 0.50, -0.32);
  const chairHeadrest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.08), chairMat);
  chairHeadrest.position.set(0, 0.98, -0.35);
  botOpponentGroup.add(chairSeat, chairBack, chairHeadrest);

  scene.add(botOpponentGroup);

  // Dedicated Lighting for Opponent so they are unmistakably clear & dramatic
  const opponentSpot = new THREE.SpotLight(0xfff6ea, 3.2, 7, Math.PI / 3.5, 0.4);
  opponentSpot.position.set(0, 2.5, -0.4);
  opponentSpot.target = botOpponentGroup;
  scene.add(opponentSpot);
  scene.add(opponentSpot.target);

  const opponentRim = new THREE.PointLight(0x0078d7, 2.5, 5);
  opponentRim.position.set(0.3, 2.1, -1.8);
  scene.add(opponentRim);

  const opponentFill = new THREE.PointLight(0xffeedd, 1.2, 4);
  opponentFill.position.set(-0.6, 1.8, -0.6);
  scene.add(opponentFill);

  // --- KERNEL ROULETTE ARBITER CONSOLE ---
  // Replaces the revolver with an industrial dual-boot execution device
  const revolverGroup = new THREE.Group();
  revolverGroup.position.set(0, 0.941, -0.15);

  const consoleBaseMat = new THREE.MeshStandardMaterial({
    color: 0x1a1e28,
    roughness: 0.35,
    metalness: 0.8
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0x9098a8,
    roughness: 0.2,
    metalness: 0.9
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x12151d,
    roughness: 0.45,
    metalness: 0.7
  });

  // Console Chassis (industrial brushed metal console)
  const consoleBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.28), consoleBaseMat);
  consoleBase.position.y = 0.025;
  consoleBase.castShadow = true;
  consoleBase.receiveShadow = true;
  revolverGroup.add(consoleBase);

  // Top plate with dual-boot branding
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x0f1218, roughness: 0.7 });
  const topPlate = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.005, 0.25), plateMat);
  topPlate.position.set(0, 0.052, 0);
  revolverGroup.add(topPlate);

  // Linux side indicator strip (left - Arch green)
  const linuxStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.006, 0.20),
    new THREE.MeshBasicMaterial({ color: 0x33ff66 })
  );
  linuxStrip.position.set(-0.15, 0.054, 0);
  revolverGroup.add(linuxStrip);

  // Windows side indicator strip (right - Windows blue)
  const winStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.006, 0.20),
    new THREE.MeshBasicMaterial({ color: 0x00a4ef })
  );
  winStrip.position.set(0.15, 0.054, 0);
  revolverGroup.add(winStrip);

  // Rotary Chamber Cylinder Dial (6 chambers)
  const cylinderGeo = new THREE.CylinderGeometry(0.065, 0.068, 0.03, 18);
  const cylinderMesh = new THREE.Mesh(cylinderGeo, darkMetalMat);
  cylinderMesh.position.set(0, 0.065, -0.045);
  cylinderMesh.castShadow = true;

  // 6 chamber LED indicator dots on top of the dial
  const chamberLeds: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const ledX = Math.sin(angle) * 0.048;
    const ledZ = Math.cos(angle) * 0.048;
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.005, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x556677 })
    );
    led.position.set(ledX, 0.016, ledZ);
    cylinderMesh.add(led);
    chamberLeds.push(led);
  }
  revolverGroup.add(cylinderMesh);

  // Dial knurled rim ring
  const dialRing = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.015, 24), chromeMat);
  dialRing.position.set(0, 0.06, -0.045);
  revolverGroup.add(dialRing);

  // --- GIANT "EXEC / SUDO" RED MECHANICAL SWITCH ---
  // Switch Housing / Bezel
  const switchHousing = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.024, 0.088), chromeMat);
  switchHousing.position.set(0, 0.06, 0.06);
  revolverGroup.add(switchHousing);

  // Keycap Canvas Texture (256x256)
  const keyCanvas = document.createElement('canvas');
  keyCanvas.width = 256;
  keyCanvas.height = 256;
  const kCtx = keyCanvas.getContext('2d')!;
  kCtx.fillStyle = '#d92626';
  kCtx.fillRect(0, 0, 256, 256);
  // Beveled border
  kCtx.strokeStyle = '#ff5555';
  kCtx.lineWidth = 14;
  kCtx.strokeRect(7, 7, 242, 242);
  kCtx.fillStyle = '#ffffff';
  kCtx.font = 'bold 54px monospace';
  kCtx.textAlign = 'center';
  kCtx.textBaseline = 'middle';
  kCtx.fillText('EXEC', 128, 128);
  const keycapTexture = new THREE.CanvasTexture(keyCanvas);

  const keycapMat = [
    new THREE.MeshStandardMaterial({ color: 0xbb2020, roughness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: 0xbb2020, roughness: 0.4 }),
    new THREE.MeshStandardMaterial({ map: keycapTexture, roughness: 0.35 }), // Top face
    new THREE.MeshStandardMaterial({ color: 0x881515, roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ color: 0xbb2020, roughness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: 0xbb2020, roughness: 0.4 })
  ];
  const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.028, 0.072), keycapMat); // Red mechanical switch keycap
  hammer.position.set(0, 0.075, 0.06);
  hammer.castShadow = true;
  revolverGroup.add(hammer);

  // Electrical spark discharge / Flash
  const muzzleFlashGeo = new THREE.SphereGeometry(0.09, 8, 8);
  const muzzleFlashMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, wireframe: true });
  const muzzleFlash = new THREE.Mesh(muzzleFlashGeo, muzzleFlashMat);
  muzzleFlash.position.set(0, 0.08, 0.06);
  muzzleFlash.visible = false;
  revolverGroup.add(muzzleFlash);

  const muzzleLight = new THREE.PointLight(0xff6600, 0, 4);
  muzzleLight.position.set(0, 0.12, 0.06);
  revolverGroup.add(muzzleLight);

  // --- PAYLOAD DRIVE DOCK & BOOT DRIVE ---
  const driveDockHousing = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.02, 0.075), chromeMat);
  driveDockHousing.position.set(-0.11, 0.055, 0.02);
  revolverGroup.add(driveDockHousing);

  // Dock slot cavity
  const dockCavity = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.012, 0.052),
    new THREE.MeshBasicMaterial({ color: 0x050810 })
  );
  dockCavity.position.set(-0.11, 0.062, 0.02);
  revolverGroup.add(dockCavity);

  // Gold contact pins
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
  const contactPin1 = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.002, 0.02), pinMat);
  contactPin1.position.set(-0.115, 0.058, 0.02);
  revolverGroup.add(contactPin1);
  const contactPin2 = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.002, 0.02), pinMat);
  contactPin2.position.set(-0.105, 0.058, 0.02);
  revolverGroup.add(contactPin2);

  // Console OS Boot Drive (Docked representation)
  const consoleBootDrive = new THREE.Group();
  const driveBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.010, 0.048),
    new THREE.MeshStandardMaterial({ color: 0x1f232b, metalness: 0.7, roughness: 0.35 })
  );
  driveBody.castShadow = true;
  consoleBootDrive.add(driveBody);

  const driveConnector = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.006, 0.016), pinMat);
  driveConnector.position.set(0, 0, -0.026);
  consoleBootDrive.add(driveConnector);

  const driveLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.003, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x33ff66 })
  );
  driveLed.position.set(0, 0.006, 0.016);
  consoleBootDrive.add(driveLed);

  consoleBootDrive.position.set(-0.11, 0.068, 0.02);
  consoleBootDrive.visible = true;
  revolverGroup.add(consoleBootDrive);

  scene.add(revolverGroup);

  // --- DEDICATED LIGHTING FOR PLAYER HAND & DUAL-BOOT CONSOLE ---
  const handSpotlight = new THREE.SpotLight(0xfff2e0, 2.2, 3.8, Math.PI * 0.38, 0.45, 1.2);
  handSpotlight.position.set(0.35, 1.80, 0.55);
  handSpotlight.target.position.set(0, 1.02, 0.05);
  scene.add(handSpotlight);
  scene.add(handSpotlight.target);

  const handRimLight = new THREE.PointLight(0x33ff66, 0.7, 1.6);
  handRimLight.position.set(-0.25, 1.15, 0.45);
  scene.add(handRimLight);

  // --- REFINED TACTICAL HACKER HAND & GLOVE MATERIALS ---
  const pHoodieCanvas = document.createElement('canvas');
  pHoodieCanvas.width = 256;
  pHoodieCanvas.height = 256;
  const phCtx = pHoodieCanvas.getContext('2d')!;
  phCtx.fillStyle = '#181b22';
  phCtx.fillRect(0, 0, 256, 256);
  // Textile weave grid
  phCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  phCtx.lineWidth = 2;
  for (let i = 0; i < 256; i += 8) {
    phCtx.beginPath();
    phCtx.moveTo(i, 0);
    phCtx.lineTo(i, 256);
    phCtx.stroke();
    phCtx.beginPath();
    phCtx.moveTo(0, i);
    phCtx.lineTo(256, i);
    phCtx.stroke();
  }
  // Green tactical seam
  phCtx.strokeStyle = '#27382d';
  phCtx.lineWidth = 4;
  phCtx.beginPath();
  phCtx.moveTo(28, 0);
  phCtx.lineTo(28, 256);
  phCtx.stroke();
  const pHoodieTexture = new THREE.CanvasTexture(pHoodieCanvas);
  const pHoodieMat = new THREE.MeshStandardMaterial({
    map: pHoodieTexture,
    roughness: 0.88,
    metalness: 0.08
  });

  // Natural warm skin material
  const pSkinMat = new THREE.MeshStandardMaterial({
    color: 0xdfa585,
    roughness: 0.48,
    metalness: 0.04
  });

  // Smooth keratin fingernails with subtle sheen
  const pNailMat = new THREE.MeshStandardMaterial({
    color: 0xf2ded2,
    roughness: 0.22,
    metalness: 0.08
  });

  // Tactical glove body (reinforced matte carbon leather)
  const pGloveMat = new THREE.MeshStandardMaterial({
    color: 0x161920,
    roughness: 0.68,
    metalness: 0.12
  });

  // Carbon armor knuckle guard
  const pArmorMat = new THREE.MeshStandardMaterial({
    color: 0x242932,
    roughness: 0.32,
    metalness: 0.40
  });

  // Titanium rivet studs
  const pRivetMat = new THREE.MeshStandardMaterial({
    color: 0x8899aa,
    roughness: 0.20,
    metalness: 0.92
  });

  // Silicone palm grip pad
  const pGripMat = new THREE.MeshStandardMaterial({
    color: 0x0e1115,
    roughness: 0.85
  });

  // --- FIRST-PERSON PLAYER ARTICULATED SKELETAL RIG ---
  const playerArmRig = new THREE.Group();

  // Forearm group (pivots around elbow/anchor)
  const playerForearmGroup = new THREE.Group();
  playerArmRig.add(playerForearmGroup);

  // Forearm sleeve (extended 0.48m long so it never cuts off or clips)
  const playerForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.054, 0.48, 16),
    pHoodieMat
  );
  playerForearm.rotation.x = Math.PI * 0.42;
  playerForearm.rotation.y = -0.15;
  playerForearm.position.set(0.06, 0.02, -0.22);
  playerForearm.castShadow = true;
  playerForearmGroup.add(playerForearm);

  // Ribbed hoodie cuff at wrist
  const playerCuff = new THREE.Mesh(
    new THREE.TorusGeometry(0.044, 0.009, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x11141a, roughness: 0.95 })
  );
  playerCuff.rotation.x = Math.PI * 0.42;
  playerCuff.position.set(0.04, 0.08, -0.01);
  playerForearmGroup.add(playerCuff);

  // Tactical wrist watch on the sleeve
  const watchCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.012, 0.038),
    new THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.4, metalness: 0.6 })
  );
  watchCase.position.set(0.07, 0.12, -0.04);
  watchCase.rotation.x = Math.PI * 0.42;
  watchCase.rotation.y = -0.15;
  playerForearmGroup.add(watchCase);

  const watchScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.032, 0.026),
    new THREE.MeshBasicMaterial({ color: 0x051a08 })
  );
  watchScreen.position.set(0.07, 0.127, -0.04);
  watchScreen.rotation.x = Math.PI * 0.42;
  watchScreen.rotation.y = -0.15;
  playerForearmGroup.add(watchScreen);

  // Wrist Pivot Group (allows wrist flexion, extension, pitch, yaw)
  const playerWristGroup = new THREE.Group();
  playerWristGroup.position.set(0.02, 0.10, 0.02);
  playerForearmGroup.add(playerWristGroup);

  // --- ANATOMICAL PALM & TACTICAL GLOVE BASE ---
  // Main Glove Palm Body
  const playerPalm = new THREE.Mesh(
    new THREE.BoxGeometry(0.076, 0.024, 0.084),
    pGloveMat
  );
  playerPalm.position.set(0, 0, 0.042);
  playerPalm.castShadow = true;
  playerWristGroup.add(playerPalm);

  // Carbon Knuckle Guard Plate on Back of Hand
  const knuckleGuard = new THREE.Mesh(
    new THREE.BoxGeometry(0.074, 0.008, 0.032),
    pArmorMat
  );
  knuckleGuard.position.set(0, 0.014, 0.054);
  playerWristGroup.add(knuckleGuard);

  // Titanium Rivets on Knuckle Guard
  [-0.028, -0.01, 0.01, 0.028].forEach(rx => {
    const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.002, 6), pRivetMat);
    rivet.position.set(rx, 0.019, 0.054);
    playerWristGroup.add(rivet);
  });

  // Silicone Palm Grip Pad on Underside
  const palmGrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.062, 0.003, 0.062),
    pGripMat
  );
  palmGrip.position.set(0, -0.013, 0.042);
  playerWristGroup.add(palmGrip);

  // Fleshy Thenar Pad (thumb muscle base)
  const thenarPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.018, 0.038, 8),
    pGloveMat
  );
  thenarPad.position.set(-0.032, -0.004, 0.025);
  thenarPad.rotation.z = Math.PI * 0.35;
  thenarPad.rotation.x = 0.2;
  playerWristGroup.add(thenarPad);

  // --- ARTICULATED 3-SEGMENT FINGERS WITH SPHERICAL JOINTS ---
  interface FingerJointRig {
    base: THREE.Group;
    phalanx1: THREE.Mesh;
    midJoint: THREE.Group;
    phalanx2: THREE.Mesh;
    tipJoint: THREE.Group;
    phalanx3: THREE.Mesh;
  }

  function createFingerJoint(
    xOffset: number,
    knuckleY: number,
    len1: number,
    len2: number,
    thickness: number
  ): FingerJointRig {
    const base = new THREE.Group();
    base.position.set(xOffset, knuckleY, 0.084); // Knuckle base position

    // 1. Knuckle Base Sphere (prevents any dislocated gaps when bending!)
    const knuckleSphere = new THREE.Mesh(
      new THREE.SphereGeometry(thickness * 1.15, 10, 10),
      pGloveMat
    );
    base.add(knuckleSphere);

    // Glove collar ring
    const gloveCollarGeo = new THREE.CylinderGeometry(thickness * 1.12, thickness * 1.12, 0.008, 10);
    gloveCollarGeo.translate(0, 0, 0.006);
    gloveCollarGeo.rotateX(Math.PI / 2);
    const gloveCollar = new THREE.Mesh(gloveCollarGeo, pArmorMat);
    base.add(gloveCollar);

    // Proximal Phalanx
    const p1Geo = new THREE.CylinderGeometry(thickness * 0.94, thickness, len1, 10);
    p1Geo.translate(0, 0, len1 / 2);
    p1Geo.rotateX(Math.PI / 2);
    const phalanx1 = new THREE.Mesh(p1Geo, pSkinMat);
    phalanx1.castShadow = true;
    base.add(phalanx1);

    // 2. Middle Interphalangeal Joint
    const midJoint = new THREE.Group();
    midJoint.position.set(0, 0, len1);
    base.add(midJoint);

    const midSphere = new THREE.Mesh(
      new THREE.SphereGeometry(thickness * 0.98, 8, 8),
      pSkinMat
    );
    midJoint.add(midSphere);

    // Intermediate/Distal Phalanx
    const p2Geo = new THREE.CylinderGeometry(thickness * 0.78, thickness * 0.92, len2, 10);
    p2Geo.translate(0, 0, len2 / 2);
    p2Geo.rotateX(Math.PI / 2);
    const phalanx2 = new THREE.Mesh(p2Geo, pSkinMat);
    phalanx2.castShadow = true;
    midJoint.add(phalanx2);

    // 3. Tip Joint with Rounded Fingertip Dome & Fingernail
    const tipJoint = new THREE.Group();
    tipJoint.position.set(0, 0, len2);
    midJoint.add(tipJoint);

    // Smooth rounded fingertip dome
    const tipDome = new THREE.Mesh(
      new THREE.SphereGeometry(thickness * 0.82, 10, 10),
      pSkinMat
    );
    tipDome.scale.set(0.95, 0.85, 1.25);
    tipJoint.add(tipDome);

    // Fingernail plate
    const nailGeo = new THREE.CylinderGeometry(thickness * 0.65, thickness * 0.75, 0.012, 8, 1, false, 0, Math.PI);
    nailGeo.translate(0, 0, 0.005);
    nailGeo.rotateX(Math.PI / 2);
    const nailMesh = new THREE.Mesh(nailGeo, pNailMat);
    nailMesh.position.set(0, thickness * 0.55, 0);
    tipJoint.add(nailMesh);

    return { base, phalanx1, midJoint, phalanx2, tipJoint, phalanx3: tipDome };
  }

  // 4 Articulated Fingers (anatomical arch: middle is longest, pinky lowest)
  const indexFinger = createFingerJoint(-0.026, 0.002, 0.033, 0.026, 0.0092);
  const middleFinger = createFingerJoint(-0.009, 0.004, 0.036, 0.028, 0.0098);
  const ringFinger = createFingerJoint(0.009, 0.003, 0.033, 0.026, 0.0092);
  const pinkyFinger = createFingerJoint(0.027, -0.001, 0.026, 0.021, 0.0082);

  playerWristGroup.add(indexFinger.base);
  playerWristGroup.add(middleFinger.base);
  playerWristGroup.add(ringFinger.base);
  playerWristGroup.add(pinkyFinger.base);

  // --- ARTICULATED THUMB WITH OPPOSING BIOMECHANICS ---
  const thumbBase = new THREE.Group();
  thumbBase.position.set(-0.038, 0.002, 0.030);
  thumbBase.rotation.set(-0.2, 0.65, 0.4);

  const thumbBaseSphere = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), pGloveMat);
  thumbBase.add(thumbBaseSphere);

  const thumbP1Geo = new THREE.CylinderGeometry(0.010, 0.012, 0.030, 8);
  thumbP1Geo.translate(0, 0, 0.015);
  thumbP1Geo.rotateX(Math.PI / 2);
  const thumbP1 = new THREE.Mesh(thumbP1Geo, pSkinMat);
  thumbBase.add(thumbP1);

  const thumbTipGroup = new THREE.Group();
  thumbTipGroup.position.set(0, 0, 0.030);
  thumbBase.add(thumbTipGroup);

  const thumbMidSphere = new THREE.Mesh(new THREE.SphereGeometry(0.0105, 8, 8), pSkinMat);
  thumbTipGroup.add(thumbMidSphere);

  const thumbP2Geo = new THREE.CylinderGeometry(0.0085, 0.010, 0.028, 8);
  thumbP2Geo.translate(0, 0, 0.014);
  thumbP2Geo.rotateX(Math.PI / 2);
  const thumbP2 = new THREE.Mesh(thumbP2Geo, pSkinMat);
  thumbTipGroup.add(thumbP2);

  const thumbDome = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), pSkinMat);
  thumbDome.position.set(0, 0, 0.028);
  thumbDome.scale.set(1.0, 0.85, 1.25);
  thumbTipGroup.add(thumbDome);

  const thumbNailGeo = new THREE.CylinderGeometry(0.007, 0.008, 0.014, 8, 1, false, 0, Math.PI);
  thumbNailGeo.translate(0, 0, 0.006);
  thumbNailGeo.rotateX(Math.PI / 2);
  const thumbNailMesh = new THREE.Mesh(thumbNailGeo, pNailMat);
  thumbNailMesh.position.set(0, 0.006, 0.026);
  thumbTipGroup.add(thumbNailMesh);

  playerWristGroup.add(thumbBase);

  // --- HELD OS BOOT DRIVE IN PLAYER'S PINCH GRIP ---
  const heldDrivePivot = new THREE.Group();
  heldDrivePivot.position.set(-0.028, -0.006, 0.095);
  heldDrivePivot.rotation.set(0.1, -0.2, 0.05);

  const heldBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.010, 0.050),
    new THREE.MeshStandardMaterial({ color: 0x1f232b, metalness: 0.7, roughness: 0.35 })
  );
  const heldPin = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.006, 0.018), pinMat);
  heldPin.position.set(0, 0, -0.028);
  const heldLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.003, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x33ff66 })
  );
  heldLed.position.set(0, 0.006, 0.018);
  heldDrivePivot.add(heldBody, heldPin, heldLed);
  playerWristGroup.add(heldDrivePivot);

  // Dynamic multi-joint finger pose helper
  function setPlayerFingerPoses(curl: number, splay: number) {
    // Index
    indexFinger.base.rotation.x = THREE.MathUtils.lerp(0.05, 0.88, curl);
    indexFinger.midJoint.rotation.x = THREE.MathUtils.lerp(0.05, 0.98, curl);
    indexFinger.base.rotation.y = THREE.MathUtils.lerp(-0.02, 0.12, splay);

    // Middle
    middleFinger.base.rotation.x = THREE.MathUtils.lerp(0.04, 0.98, curl);
    middleFinger.midJoint.rotation.x = THREE.MathUtils.lerp(0.04, 1.08, curl);

    // Ring
    ringFinger.base.rotation.x = THREE.MathUtils.lerp(0.06, 1.12, curl);
    ringFinger.midJoint.rotation.x = THREE.MathUtils.lerp(0.06, 1.18, curl);
    ringFinger.base.rotation.y = THREE.MathUtils.lerp(0.02, -0.08, splay);

    // Pinky
    pinkyFinger.base.rotation.x = THREE.MathUtils.lerp(0.08, 1.22, curl);
    pinkyFinger.midJoint.rotation.x = THREE.MathUtils.lerp(0.08, 1.28, curl);
    pinkyFinger.base.rotation.y = THREE.MathUtils.lerp(0.05, -0.15, splay);

    // Thumb
    thumbBase.rotation.x = THREE.MathUtils.lerp(-0.15, -0.35, curl);
    thumbBase.rotation.y = THREE.MathUtils.lerp(0.35, 0.88, curl);
    thumbTipGroup.rotation.x = THREE.MathUtils.lerp(0.05, 0.65, curl);
  }

  // Initial resting finger pose (gripping the drive)
  setPlayerFingerPoses(0.95, 0.0);

  // Player Arm Initial Rest Position (anchored below screen view)
  const playerRestPos = new THREE.Vector3(0.24, 0.82, 0.80);
  const playerRestRot = new THREE.Vector3(-0.35, -0.22, 0.08);
  const playerWristRestRot = new THREE.Vector3(0.08, -0.05, 0);

  playerArmRig.position.copy(playerRestPos);
  playerArmRig.rotation.set(playerRestRot.x, playerRestRot.y, playerRestRot.z);
  playerWristGroup.rotation.set(playerWristRestRot.x, playerWristRestRot.y, playerWristRestRot.z);
  scene.add(playerArmRig);

  // Camera sway and shake state
  let shakeIntensity = 0;
  let pushProgress = 0; // 0 to 1

  function setCameraShake(intensity: number) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
  }

  function setCameraPush(progress: number) {
    pushProgress = THREE.MathUtils.clamp(progress, 0, 1);
  }

  // Console & Switch Animation Helpers
  async function spinRevolver(): Promise<void> {
    const startRot = cylinderMesh.rotation.y;
    const extraRot = Math.PI * 12 + Math.random() * Math.PI * 2;
    const duration = 900;
    const startTime = performance.now();

    return new Promise(resolve => {
      function step() {
        const elapsed = performance.now() - startTime;
        const p = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - p, 3);
        cylinderMesh.rotation.y = startRot + extraRot * ease;

        // Animate chamber LEDs strobing as the rotary dial spins
        const activeSlot = Math.abs(Math.floor(cylinderMesh.rotation.y / (Math.PI / 3))) % 6;
        chamberLeds.forEach((led, idx) => {
          (led.material as THREE.MeshBasicMaterial).color.setHex(idx === activeSlot ? 0xffaa00 : 0x334455);
        });

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      step();
    });
  }

  async function cockHammer(): Promise<void> {
    // Prime the switch keycap spring
    hammer.position.y = 0.082;
  }

  async function uncockHammer(): Promise<void> {
    hammer.position.y = 0.075;
  }

  async function fireRecoil(): Promise<void> {
    // Fatal Execution: Keycap slams fully down and sparks burst
    hammer.position.y = 0.052;
    leftHand.position.y = 0.10;
    muzzleFlash.visible = true;
    muzzleLight.color.setHex(0xff3300);
    muzzleLight.intensity = 8;

    await new Promise(r => setTimeout(r, 120));
    muzzleFlash.visible = false;
    muzzleLight.intensity = 0;
  }

  async function clickHammer(): Promise<void> {
    // Safe Execution: Keycap slams down with a tactile mechanical click & springs back
    hammer.position.y = 0.056;
    leftHand.position.y = 0.11;
    muzzleLight.color.setHex(0x33ff66);
    muzzleLight.intensity = 2.5;

    await new Promise(r => setTimeout(r, 90));
    hammer.position.y = 0.075;
    leftHand.position.y = 0.18;
    muzzleLight.intensity = 0;
  }

  async function aimRevolver(target: 'player' | 'bot' | 'center'): Promise<void> {
    // Animate bot's arm reaching forward to slam the EXEC switch, or camera focus
    const duration = 450;
    const startTime = performance.now();

    // Start bot arm transforms
    const startUpperRotX = leftUpperArm.rotation.x;
    const startUpperRotY = leftUpperArm.rotation.y;
    const startUpperRotZ = leftUpperArm.rotation.z;

    const startForeX = leftForearm.position.x;
    const startForeY = leftForearm.position.y;
    const startForeZ = leftForearm.position.z;
    const startForeRotX = leftForearm.rotation.x;
    const startForeRotY = leftForearm.rotation.y;

    const startHandX = leftHand.position.x;
    const startHandY = leftHand.position.y;
    const startHandZ = leftHand.position.z;
    const startHandRotX = leftHand.rotation.x;

    let targetUpperRotX = 0.65;
    let targetUpperRotY = -0.15;
    let targetUpperRotZ = 0.1;

    let targetForeX = 0.18;
    let targetForeY = 0.18;
    let targetForeZ = 0.44;
    let targetForeRotX = 1.30;
    let targetForeRotY = -0.22;

    let targetHandX = 0.08;
    let targetHandY = 0.065;
    let targetHandZ = 0.72;
    let targetHandRotX = 0;

    if (target === 'bot') {
      // Bot arm lifts from keyboard and hovers directly over the red EXEC switch!
      targetUpperRotX = 1.05;
      targetUpperRotY = -0.10;
      targetUpperRotZ = 0.15;

      targetForeX = 0.12;
      targetForeY = 0.28;
      targetForeZ = 0.65;
      targetForeRotX = 0.65;
      targetForeRotY = -0.15;

      targetHandX = 0.01;
      targetHandY = 0.18;
      targetHandZ = 1.22;
      targetHandRotX = -0.25;

      cockHammer();
    } else if (target === 'player') {
      // Player turn: prime the switch
      cockHammer();
    } else {
      // Return to resting position on keyboard
      uncockHammer();
    }

    return new Promise(resolve => {
      function step() {
        const elapsed = performance.now() - startTime;
        const p = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - p, 3);

        leftUpperArm.rotation.x = THREE.MathUtils.lerp(startUpperRotX, targetUpperRotX, ease);
        leftUpperArm.rotation.y = THREE.MathUtils.lerp(startUpperRotY, targetUpperRotY, ease);
        leftUpperArm.rotation.z = THREE.MathUtils.lerp(startUpperRotZ, targetUpperRotZ, ease);

        leftForearm.position.x = THREE.MathUtils.lerp(startForeX, targetForeX, ease);
        leftForearm.position.y = THREE.MathUtils.lerp(startForeY, targetForeY, ease);
        leftForearm.position.z = THREE.MathUtils.lerp(startForeZ, targetForeZ, ease);
        leftForearm.rotation.x = THREE.MathUtils.lerp(startForeRotX, targetForeRotX, ease);
        leftForearm.rotation.y = THREE.MathUtils.lerp(startForeRotY, targetForeRotY, ease);

        leftHand.position.x = THREE.MathUtils.lerp(startHandX, targetHandX, ease);
        leftHand.position.y = THREE.MathUtils.lerp(startHandY, targetHandY, ease);
        leftHand.position.z = THREE.MathUtils.lerp(startHandZ, targetHandZ, ease);
        leftHand.rotation.x = THREE.MathUtils.lerp(startHandRotX, targetHandRotX, ease);

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      step();
    });
  }

  // --- CINEMATIC CONSOLE ZOOM ---
  let consoleZoomProgress = 0; // 0 = default over-the-shoulder, 1 = close up on console
  const zoomCamPos = new THREE.Vector3(0, 1.20, 0.38);
  const zoomCamLook = new THREE.Vector3(0, 0.99, -0.05);

  async function zoomConsole(zoomIn: boolean, durationMs = 500): Promise<void> {
    const startZoom = consoleZoomProgress;
    const targetZoom = zoomIn ? 1 : 0;
    const startTime = performance.now();

    return new Promise(resolve => {
      function step() {
        const elapsed = performance.now() - startTime;
        const p = Math.min(1, elapsed / durationMs);
        const ease = 1 - Math.pow(1 - p, 3);
        consoleZoomProgress = THREE.MathUtils.lerp(startZoom, targetZoom, ease);
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          consoleZoomProgress = targetZoom;
          resolve();
        }
      }
      step();
    });
  }

  // --- FIRST-PERSON PLAYER CONTINUOUS BIOMECHANICAL ANIMATION ---
  async function animatePlayerAction(): Promise<void> {
    heldDrivePivot.visible = true;
    heldDrivePivot.position.set(-0.028, -0.006, 0.095);
    consoleBootDrive.visible = false;
    setPlayerFingerPoses(0.95, 0.0);

    const totalDuration = 1250;
    const startTime = performance.now();

    // Keyframe poses
    const pRest = playerRestPos.clone();
    const rRest = playerRestRot.clone();
    const wRest = playerWristRestRot.clone();

    const pReach = new THREE.Vector3(-0.05, 1.05, 0.36);
    const rReach = new THREE.Vector3(-0.16, 0.08, -0.06);
    const wReach = new THREE.Vector3(-0.14, 0.18, -0.08);

    const pDock = new THREE.Vector3(-0.11, 1.045, 0.22);
    const rDock = new THREE.Vector3(-0.10, 0.05, 0);
    const wDock = new THREE.Vector3(-0.05, 0.05, 0);

    const pHover = new THREE.Vector3(0, 1.12, 0.16);
    const rHover = new THREE.Vector3(-0.06, 0, 0);
    const wHover = new THREE.Vector3(-0.45, 0, 0); // Wrist cocks back 26 deg

    const pWindup = new THREE.Vector3(0, 1.155, 0.15);
    const pSlam = new THREE.Vector3(0, 1.030, 0.15);
    const wSlam = new THREE.Vector3(0.05, 0, 0);

    let driveLatched = false;

    return new Promise(resolve => {
      function step() {
        const elapsed = performance.now() - startTime;
        const s = Math.min(1, elapsed / totalDuration);

        if (s < 0.36) {
          // 1. Entrance arc towards dock
          const p = s / 0.36;
          const ease = p * p * (3 - 2 * p); // smoothstep
          playerArmRig.position.lerpVectors(pRest, pReach, ease);
          playerArmRig.rotation.x = THREE.MathUtils.lerp(rRest.x, rReach.x, ease);
          playerArmRig.rotation.y = THREE.MathUtils.lerp(rRest.y, rReach.y, ease);
          playerArmRig.rotation.z = THREE.MathUtils.lerp(rRest.z, rReach.z, ease);
          playerWristGroup.rotation.x = THREE.MathUtils.lerp(wRest.x, wReach.x, ease);
          playerWristGroup.rotation.y = THREE.MathUtils.lerp(wRest.y, wReach.y, ease);
          playerWristGroup.rotation.z = THREE.MathUtils.lerp(wRest.z, wReach.z, ease);
          setPlayerFingerPoses(0.95, 0.0);
        } else if (s < 0.52) {
          // 2. Continuous slide into dock slot
          const p = (s - 0.36) / 0.16;
          playerArmRig.position.lerpVectors(pReach, pDock, p);
          playerArmRig.rotation.x = THREE.MathUtils.lerp(rReach.x, rDock.x, p);
          playerArmRig.rotation.y = THREE.MathUtils.lerp(rReach.y, rDock.y, p);
          playerWristGroup.rotation.x = THREE.MathUtils.lerp(wReach.x, wDock.x, p);
          playerWristGroup.rotation.y = THREE.MathUtils.lerp(wReach.y, wDock.y, p);

          // Drive slides straight into the dock slot
          heldDrivePivot.position.z = THREE.MathUtils.lerp(0.095, 0.065, p);

          if (p >= 0.85 && !driveLatched) {
            driveLatched = true;
            heldDrivePivot.visible = false;
            consoleBootDrive.visible = true;
            (driveLed.material as THREE.MeshBasicMaterial).color.setHex(0x33ff66);
          }
        } else if (s < 0.72) {
          // 3. Fingers peel off drive, hand arcs up towards red switch
          const p = (s - 0.52) / 0.20;
          const ease = p * p * (3 - 2 * p);
          playerArmRig.position.lerpVectors(pDock, pHover, ease);
          playerArmRig.rotation.x = THREE.MathUtils.lerp(rDock.x, rHover.x, ease);
          playerArmRig.rotation.y = THREE.MathUtils.lerp(rDock.y, rHover.y, ease);
          playerWristGroup.rotation.x = THREE.MathUtils.lerp(wDock.x, wHover.x, ease);
          playerWristGroup.rotation.y = THREE.MathUtils.lerp(wDock.y, wHover.y, ease);
          playerWristGroup.rotation.z = THREE.MathUtils.lerp(wDock.z, wHover.z, ease);

          // Fingers peel off and spread wide open
          setPlayerFingerPoses(THREE.MathUtils.lerp(0.95, 0.0, ease), THREE.MathUtils.lerp(0.0, 0.85, ease));
        } else if (s < 0.84) {
          // 4. Dramatic hover suspension right above switch with subtle micro-tension
          const p = (s - 0.72) / 0.12;
          const tremor = Math.sin(p * Math.PI * 4) * 0.002;
          playerArmRig.position.set(pHover.x, pHover.y + tremor, pHover.z);
          playerWristGroup.rotation.x = wHover.x + tremor * 2;
          setPlayerFingerPoses(0.0, 0.85);
        } else if (s < 0.88) {
          // 5. Fast upward wind-up
          const p = (s - 0.84) / 0.04;
          playerArmRig.position.lerpVectors(pHover, pWindup, p);
          playerWristGroup.rotation.x = THREE.MathUtils.lerp(wHover.x, wHover.x - 0.1, p);
          setPlayerFingerPoses(0.0, 0.90);
        } else if (s < 0.94) {
          // 6. Explosive downward strike!
          const p = (s - 0.88) / 0.06;
          playerArmRig.position.lerpVectors(pWindup, pSlam, p);
          playerWristGroup.rotation.x = THREE.MathUtils.lerp(wHover.x - 0.1, wSlam.x, p);

          // Fingers flex on impact absorbing strike force
          setPlayerFingerPoses(THREE.MathUtils.lerp(0.0, 0.22, p), THREE.MathUtils.lerp(0.90, 0.5, p));

          hammer.position.y = THREE.MathUtils.lerp(0.075, 0.052, p);
        } else {
          // 7. Impact hold with switch fully bottomed out
          playerArmRig.position.copy(pSlam);
          playerWristGroup.rotation.x = wSlam.x;
          setPlayerFingerPoses(0.22, 0.5);
          hammer.position.y = 0.052;
        }

        if (s < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      step();
    });
  }

  async function retractPlayerArm(): Promise<void> {
    const durationRetract = 420;
    const startPos = playerArmRig.position.clone();
    const startRot = playerArmRig.rotation.clone();
    const startWristRot = playerWristGroup.rotation.clone();
    const startTime = performance.now();

    return new Promise(resolve => {
      function step() {
        const elapsed = performance.now() - startTime;
        const p = Math.min(1, elapsed / durationRetract);
        const ease = 1 - Math.pow(1 - p, 3);

        playerArmRig.position.lerpVectors(startPos, playerRestPos, ease);
        playerArmRig.rotation.x = THREE.MathUtils.lerp(startRot.x, playerRestRot.x, ease);
        playerArmRig.rotation.y = THREE.MathUtils.lerp(startRot.y, playerRestRot.y, ease);
        playerArmRig.rotation.z = THREE.MathUtils.lerp(startRot.z, playerRestRot.z, ease);

        playerWristGroup.rotation.x = THREE.MathUtils.lerp(startWristRot.x, playerWristRestRot.x, ease);
        playerWristGroup.rotation.y = THREE.MathUtils.lerp(startWristRot.y, playerWristRestRot.y, ease);
        playerWristGroup.rotation.z = THREE.MathUtils.lerp(startWristRot.z, playerWristRestRot.z, ease);

        // Fingers relax back to resting pose
        setPlayerFingerPoses(THREE.MathUtils.lerp(0.22, 0.4, ease), THREE.MathUtils.lerp(0.5, 0.1, ease));

        if (p < 1) requestAnimationFrame(step);
        else resolve();
      }
      step();
    });
  }

  let isOpponentDead = false;
  let lastBlink = 0;
  let currentOpponentOS: 'windows' | 'linux' = 'windows';

  function setOpponentDefeated(defeated: boolean, botOS: 'windows' | 'linux' = currentOpponentOS) {
    isOpponentDead = defeated;
    currentOpponentOS = botOS;
    if (defeated) {
      drawFace(true, botOS);
      faceTexture.needsUpdate = true;
      if (botOS === 'linux') {
        // Dramatic Linux Hacker forward collapse onto desk / keyboard
        torsoMesh.position.set(0, 0.20, -0.05);
        torsoMesh.rotation.set(0.65, 0, 0.12);
        headGroup.position.set(0.04, 0.62, 0.18);
        headGroup.rotation.set(1.05, 0.15, 0.25);
      } else {
        // Dramatic Windows Dealer stiffen & slump back/side
        torsoMesh.position.set(0.08, 0.28, -0.04);
        torsoMesh.rotation.set(-0.25, 0, 0.35);
        headGroup.position.set(0.12, 0.82, -0.06);
        headGroup.rotation.set(-0.45, 0.1, 0.42);
      }
    } else {
      drawFace(false, botOS);
      faceTexture.needsUpdate = true;
      torsoMesh.position.set(0, 0.32, 0);
      torsoMesh.rotation.set(0, 0, 0);
      headGroup.position.set(0, 0.88, 0.02);
      headGroup.rotation.set(0, 0, 0);
    }
  }

  function configureScene(playerOS: 'linux' | 'windows') {
    const botOS = playerOS === 'linux' ? 'windows' : 'linux';
    currentOpponentOS = botOS;
    drawOpponentOutfit(botOS);
    suitTexture.needsUpdate = true;
    handTexture.needsUpdate = true;
    drawFace(false, botOS);
    faceTexture.needsUpdate = true;

    // Monitor glow lights
    playerMonitorGlow.color.setHex(playerOS === 'linux' ? 0x33ff66 : 0x0078d7);
    botMonitorGlow.color.setHex(playerOS === 'linux' ? 0x0078d7 : 0x33ff66);
    opponentRim.color.setHex(playerOS === 'linux' ? 0x0078d7 : 0x33ff66);

    // Desk stickers
    if (playerOS === 'linux') {
      tuxGroup.position.set(-0.35, 0.941, 0.45);
      tuxGroup.rotation.z = 0.2;
      winGroup.position.set(0.35, 0.941, -1.05);
      winGroup.rotation.z = Math.PI;
    } else {
      winGroup.position.set(-0.35, 0.941, 0.45);
      winGroup.rotation.z = 0.2;
      tuxGroup.position.set(0.35, 0.941, -1.05);
      tuxGroup.rotation.z = Math.PI;
    }
  }

  function update(time: number) {
    // Subtle idle sway for camera
    const swayX = Math.sin(time * 0.0008) * 0.02;
    const swayY = Math.cos(time * 0.0011) * 0.015;

    // Opponent animations (blinking, breathing, subtle head tilt)
    if (!isOpponentDead) {
      const blinkCycle = time % 3800;
      const isBlinking = blinkCycle < 150;
      if (isBlinking !== (lastBlink < 150)) {
        drawFace(isBlinking);
        faceTexture.needsUpdate = true;
      }
      lastBlink = blinkCycle;

      torsoMesh.position.y = 0.32 + Math.sin(time * 0.002) * 0.004;
      headGroup.position.y = 0.88 + Math.sin(time * 0.002) * 0.006;
      headGroup.rotation.y = Math.sin(time * 0.0008) * 0.03;
      headGroup.rotation.x = Math.sin(time * 0.0012) * 0.015;
    }

    // Push in towards center/opponent
    const pushZ = -pushProgress * 0.55;
    const pushY = -pushProgress * 0.08;

    // Camera shake decay
    let shakeX = 0;
    let shakeY = 0;
    if (shakeIntensity > 0.001) {
      shakeX = (Math.random() - 0.5) * shakeIntensity;
      shakeY = (Math.random() - 0.5) * shakeIntensity;
      shakeIntensity *= 0.88;
    }

    // Interpolate camera position and lookAt between default view and console zoom
    const curPos = new THREE.Vector3().lerpVectors(baseCamPos, zoomCamPos, consoleZoomProgress);
    const curLook = new THREE.Vector3().lerpVectors(baseCamLook, zoomCamLook, consoleZoomProgress);

    camera.position.set(
      curPos.x + swayX + shakeX,
      curPos.y + swayY + pushY + shakeY,
      curPos.z + pushZ
    );
    camera.lookAt(curLook.x, curLook.y, curLook.z);

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function setMonitorTextures(playerTex: THREE.Texture, botTex: THREE.Texture) {
    playerCRT.screen.material = new THREE.MeshBasicMaterial({ map: playerTex });
    botCRT.screen.material = new THREE.MeshBasicMaterial({ map: botTex });
  }

  return {
    scene,
    camera,
    renderer,
    playerMonitorMesh: playerCRT.screen,
    botMonitorMesh: botCRT.screen,
    setMonitorTextures,
    revolverGroup,
    cylinderMesh,
    update,
    setCameraShake,
    setCameraPush,
    spinRevolver,
    aimRevolver,
    fireRecoil,
    clickHammer,
    setOpponentDefeated,
    zoomConsole,
    animatePlayerAction,
    retractPlayerArm,
    configureScene
  };
}

