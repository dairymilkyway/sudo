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

## Milestone 5: Turns
- Built `BotAI` in `src/bot.ts` with probability calculation `pullsSurvivedSinceSpin / 6` to choose SPIN vs PULL, thinking delays between 800ms and 1800ms, and Linux vs Windows themed trash talk lines.
- Built interactive HUD with 6-dot chamber indicator, turn label, and PULL / SPIN buttons with automatic disable states.
- Implemented turn cycling, revolver aiming, chamber cycling, and camera reactions on action.

## Milestone 6: Linux Death
- Terminal executes `$ sudo rm -rf /*`, prints password prompt with dots, and simulates disintegration of desktop icons, wallpaper, and file deletion scrolls with camera shake and crackle.
- Hard cut to black screen with realistic `Kernel panic - not syncing: Attempted to kill init! exitcode=0x00000009` and call trace.
- Drops to `grub rescue>` after 3s where typing `reboot` (or clicking the clickable hint) restarts the match seamlessly while retaining session wins.

## Milestone 7: Windows Death
- Bot terminal executes `del /f /s /q C:\*` with rapid deletion of System32 core executables and drivers.
- Full-screen Windows 10/11 BSOD overlay (`#0078d7`, `:(`, 0-100% counter, and stop code `KERNEL_ROULETTE_FATAL`).
- Camera pushes in, followed by "YOU SURVIVED" banner and "PLAY AGAIN" button.





