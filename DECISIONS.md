# Decisions Log

## Milestone 1: Boot
- Setup Vite + TypeScript + Three.js vanilla template with minimal dependencies.
- Kept configuration flat without extra libraries.

## Milestone 2: Room
- Created dim hacker bedroom with wood desk, two beige CRT monitors with screen glow, desk lamp, Tux sticker, and Windows 4-pane sticker.
- Built low-poly revolver (frame, cylinder, barrel, grip) with spin animation and aiming lerp.
- Implemented camera sway, push-in, and shake decay in `scene.ts`.

## Milestone 3: Logic
- Built pure `game.ts` state machine with zero DOM or Three.js dependencies.
- Handles turn passing, random bullet slot allocation, cyclic chamber advancement, chamber history, and spin logic.
- Included `runBulletDistributionTest(1000)` test function verified via tsx with ~16.6% per chamber slot within tolerance.

## Milestone 4: Terminals
- Built `VirtualTerminal` in `src/terminal.ts` drawing on HTML Canvas backing a `THREE.CanvasTexture`.
- Supports typewriter effect (`typeText`), line scrolling, scanline CRT raster effect, blinking cursor, and custom theme colors (`#33ff66` Linux prompt vs `#00a4ef` cmd prompt).



