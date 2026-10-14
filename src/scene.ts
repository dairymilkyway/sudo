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

  // Player Monitor (near side, offset to left so desk and opponent are visible)
  const playerCRT = createCRTMonitor(0x0a1a0d);
  playerCRT.casing.position.set(-0.56, 0.94, 0.48);
  playerCRT.casing.rotation.y = 0.32;
  playerCRT.casing.rotation.x = -0.05;
  scene.add(playerCRT.casing);

  // Bot Monitor (far side, offset to right)
  const botCRT = createCRTMonitor(0x081320);
  botCRT.casing.position.set(0.60, 0.94, -0.95);
  botCRT.casing.rotation.y = Math.PI - 0.36;
  scene.add(botCRT.casing);

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

  // Arms in suit fabric
  const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.36, 0.14), suitMat);
  leftUpperArm.position.set(-0.32, 0.42, 0.05);
  leftUpperArm.rotation.x = 0.55;
  leftUpperArm.rotation.z = -0.1;

  const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.36, 0.14), suitMat);
  rightUpperArm.position.set(0.32, 0.42, 0.05);
  rightUpperArm.rotation.x = 0.55;
  rightUpperArm.rotation.z = 0.1;

  const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.36, 0.12), suitMat);
  leftForearm.position.set(-0.34, 0.16, 0.32);
  leftForearm.rotation.x = 1.25;
  leftForearm.rotation.z = -0.05;

  const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.36, 0.12), suitMat);
  rightForearm.position.set(0.34, 0.16, 0.32);
  rightForearm.rotation.x = 1.25;
  rightForearm.rotation.z = 0.05;

  botOpponentGroup.add(leftUpperArm, rightUpperArm, leftForearm, rightForearm);

  // Hands resting on desk
  const handMaterials = [
    skinMat,
    skinMat,
    new THREE.MeshStandardMaterial({ map: handTexture, roughness: 0.55 }), // top of hand
    skinMat,
    skinMat,
    skinMat
  ];
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.16), handMaterials);
  leftHand.position.set(-0.32, 0.05, 0.55);
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.16), handMaterials);
  rightHand.position.set(0.32, 0.05, 0.55);
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

  // Revolver Model (low-poly)
  const revolverGroup = new THREE.Group();
  revolverGroup.position.set(0, 0.98, -0.15);

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x4a4f57,
    roughness: 0.35,
    metalness: 0.85
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x24282e,
    roughness: 0.4,
    metalness: 0.75
  });
  const gripWoodMat = new THREE.MeshStandardMaterial({
    color: 0x5a2d16,
    roughness: 0.6
  });

  // Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.15, 0.08), gripWoodMat);
  grip.position.set(0, -0.05, 0.11);
  grip.rotation.x = -0.35;
  revolverGroup.add(grip);

  // Frame / Body
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, 0.15), metalMat);
  frame.position.set(0, 0.02, 0.04);
  revolverGroup.add(frame);

  // Hammer
  const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.04, 0.03), darkMetalMat);
  hammer.position.set(0, 0.065, 0.11);
  hammer.rotation.x = 0.4;
  revolverGroup.add(hammer);

  // Cylinder (chamber) - rotates on SPIN
  const cylinderGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.12, 6);
  cylinderGeo.rotateX(Math.PI / 2);
  const cylinderMesh = new THREE.Mesh(cylinderGeo, darkMetalMat);
  cylinderMesh.position.set(0, 0.03, -0.01);
  revolverGroup.add(cylinderMesh);

  // Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.24, 12), metalMat);
  barrel.position.set(0, 0.045, -0.18);
  barrel.rotation.x = Math.PI / 2;
  revolverGroup.add(barrel);

  // Muzzle flash mesh & light
  const muzzleFlashGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const muzzleFlashMat = new THREE.MeshBasicMaterial({ color: 0xffea78, wireframe: true });
  const muzzleFlash = new THREE.Mesh(muzzleFlashGeo, muzzleFlashMat);
  muzzleFlash.position.set(0, 0.045, -0.32);
  muzzleFlash.visible = false;
  revolverGroup.add(muzzleFlash);

  const muzzleLight = new THREE.PointLight(0xffaa22, 0, 3);
  muzzleLight.position.set(0, 0.045, -0.32);
  revolverGroup.add(muzzleLight);

  // Sight
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.014, 0.02), metalMat);
  sight.position.set(0, 0.075, -0.28);
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
    const extraRot = Math.PI * 12 + Math.random() * Math.PI * 2;
    const duration = 900;
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

  async function cockHammer(): Promise<void> {
    hammer.rotation.x = -0.3; // cocked back
  }

  async function uncockHammer(): Promise<void> {
    hammer.rotation.x = 0.4; // released forward
  }

  async function fireRecoil(): Promise<void> {
    // Flash
    muzzleFlash.visible = true;
    muzzleLight.intensity = 5;
    uncockHammer();

    const origRotX = revolverGroup.rotation.x;
    const origY = revolverGroup.position.y;
    const origZ = revolverGroup.position.z;

    // Recoil kick up & back
    revolverGroup.rotation.x += 0.45;
    revolverGroup.position.y += 0.08;
    revolverGroup.position.z += (revolverGroup.rotation.y === 0 ? 0.08 : -0.08);

    await new Promise(r => setTimeout(r, 60));
    muzzleFlash.visible = false;
    muzzleLight.intensity = 0;

    // Recover from recoil
    const startTime = performance.now();
    const duration = 250;
    await new Promise<void>(resolve => {
      function step() {
        const elapsed = performance.now() - startTime;
        const p = Math.min(1, elapsed / duration);
        revolverGroup.rotation.x = THREE.MathUtils.lerp(revolverGroup.rotation.x, origRotX, p);
        revolverGroup.position.y = THREE.MathUtils.lerp(revolverGroup.position.y, origY, p);
        revolverGroup.position.z = THREE.MathUtils.lerp(revolverGroup.position.z, origZ, p);
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      step();
    });
  }

  async function clickHammer(): Promise<void> {
    // Click hammer snap forward with tiny recoil twitch
    uncockHammer();
    revolverGroup.position.y += 0.015;
    await new Promise(r => setTimeout(r, 40));
    revolverGroup.position.y -= 0.015;
  }

  async function aimRevolver(target: 'player' | 'bot' | 'center'): Promise<void> {
    const startY = revolverGroup.position.y;
    const startZ = revolverGroup.position.z;
    const startX = revolverGroup.position.x;
    const startRotY = revolverGroup.rotation.y;
    const startRotX = revolverGroup.rotation.x;
    const startRotZ = revolverGroup.rotation.z;

    let targetRotY = 0;
    let targetRotX = 0;
    let targetRotZ = Math.PI / 2; // flat on desk by default
    let targetX = 0;
    let targetY = 0.98;
    let targetZ = -0.15;

    if (target === 'player') {
      // Picked up by player: aimed back towards player camera (+Z)
      targetX = 0;
      targetY = 1.22;
      targetZ = 0.7;
      targetRotY = 0;
      targetRotX = -0.12;
      targetRotZ = 0;
      cockHammer();
    } else if (target === 'bot') {
      // Picked up by bot: raised and aimed directly at bot opponent (-Z)
      targetX = 0;
      targetY = 1.35;
      targetZ = -0.85;
      targetRotY = Math.PI;
      targetRotX = 0.12;
      targetRotZ = 0;
      cockHammer();
    } else {
      // center rest on desk
      targetX = 0;
      targetY = 0.98;
      targetZ = -0.15;
      targetRotY = 0;
      targetRotX = 0;
      targetRotZ = Math.PI / 2;
    }

    const duration = 500;
    const startTime = performance.now();

    return new Promise(resolve => {
      function step() {
        const elapsed = performance.now() - startTime;
        const p = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - p, 3); // smooth cubic ease out

        revolverGroup.position.x = THREE.MathUtils.lerp(startX, targetX, ease);
        revolverGroup.position.y = THREE.MathUtils.lerp(startY, targetY, ease);
        revolverGroup.position.z = THREE.MathUtils.lerp(startZ, targetZ, ease);
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

