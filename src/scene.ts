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
  setOpponentDefeated: (defeated: boolean) => void;
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

    function drawFace(eyesClosed: boolean) {
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

      // 5 o'clock shadow / stubble
      fCtx.fillStyle = 'rgba(60, 45, 35, 0.18)';
      fCtx.beginPath();
      fCtx.ellipse(256, 385, 115, 80, 0, 0, Math.PI);
      fCtx.fill();

      // Eyebrows
      fCtx.strokeStyle = '#2d1c10';
      fCtx.lineWidth = 10;
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

          // Iris (Striking Windows blue)
          const irisGrad = fCtx.createRadialGradient(x, eyeY, 2, x, eyeY, 13);
          irisGrad.addColorStop(0, '#00a4ef');
          irisGrad.addColorStop(0.7, '#0078d7');
          irisGrad.addColorStop(1, '#003a68');
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
      fCtx.lineTo(512, 85);
      fCtx.quadraticCurveTo(380, 95, 300, 75);
      fCtx.quadraticCurveTo(240, 110, 150, 90);
      fCtx.lineTo(0, 85);
      fCtx.closePath();
      fCtx.fill();
    }

    drawFace(false);
    const faceTexture = new THREE.CanvasTexture(faceCanvas);

    // 2. Suit Canvas (512x512)
    const suitCanvas = document.createElement('canvas');
    suitCanvas.width = 512;
    suitCanvas.height = 512;
    const sCtx = suitCanvas.getContext('2d')!;

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
    sCtx.fillStyle = '#f25022'; // Red
    sCtx.fillRect(pinX - pSize - pGap / 2, pinY - pSize - pGap / 2, pSize, pSize);
    sCtx.fillStyle = '#7fba00'; // Green
    sCtx.fillRect(pinX + pGap / 2, pinY - pSize - pGap / 2, pSize, pSize);
    sCtx.fillStyle = '#00a4ef'; // Blue
    sCtx.fillRect(pinX - pSize - pGap / 2, pinY + pGap / 2, pSize, pSize);
    sCtx.fillStyle = '#ffb900'; // Yellow
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

    const suitTexture = new THREE.CanvasTexture(suitCanvas);

    // 3. Hand Canvas (256x256)
    const handCanvas = document.createElement('canvas');
    handCanvas.width = 256;
    handCanvas.height = 256;
    const hCtx = handCanvas.getContext('2d')!;

    hCtx.fillStyle = '#e4b695';
    hCtx.fillRect(0, 0, 256, 256);

    // Suit sleeve cuff
    hCtx.fillStyle = '#1c222d';
    hCtx.fillRect(0, 180, 256, 76);
    hCtx.fillStyle = '#ffffff';
    hCtx.fillRect(0, 172, 256, 8);

    // Knuckles and fingernails
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
      handTexture,
      hairTexture
    };
  }

  const { faceTexture, drawFace, suitTexture, handTexture, hairTexture } = createOpponentTextures();

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
    muzzleFlash.visible = true;
    muzzleLight.color.setHex(0xff3300);
    muzzleLight.intensity = 8;

    await new Promise(r => setTimeout(r, 120));
    muzzleFlash.visible = false;
    muzzleLight.intensity = 0;
  }

  async function clickHammer(): Promise<void> {
    // Safe Execution: Keycap slams down with a tactile mechanical click & springs back
    hammer.position.y = 0.058;
    muzzleLight.color.setHex(0x33ff66);
    muzzleLight.intensity = 2.5;

    await new Promise(r => setTimeout(r, 80));
    hammer.position.y = 0.075;
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

  let isOpponentDead = false;
  let lastBlink = 0;

  function setOpponentDefeated(defeated: boolean) {
    isOpponentDead = defeated;
    if (defeated) {
      drawFace(true);
      faceTexture.needsUpdate = true;
      headGroup.rotation.x = -0.35;
      headGroup.rotation.z = 0.22;
    } else {
      drawFace(false);
      faceTexture.needsUpdate = true;
      headGroup.rotation.x = 0;
      headGroup.rotation.z = 0;
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
    setOpponentDefeated
  };
}

