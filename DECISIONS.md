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

## Milestone 8: Polish
- WebAudio synthesizers implemented in `audio.ts` without relying on external mp3/wav files: procedural gunshot impulse + lowpass filtering, empty cylinder clicks, spin ratchets, typewriter clickers, and glitch buzzes.
- Session-only win/loss tracking kept purely in JS memory state across game reboots.
- Dynamic camera reactions: subtle idle drift, pull push-ins, and multi-stage trauma shakes on hammer drops / death sequences.

## Milestone 9: Deploy
- Production build confirmed passing via Vite + tsc with zero errors.
- Comprehensive Vercel static deployment documentation provided in `README.md`.

## Enhancement: 3D Opponent Model & Normal Textures
- Implemented high-resolution procedural canvas textures for the opponent:
  - Natural human face texture with warm skin tones, shaded contours, 5 o'clock shadow, defined eyebrows, and piercing Windows blue eyes.
  - Organic animated eye blinking every 3.8s and subtle breathing chest/head movements.
  - Detailed corporate suit texture with woven fabric pattern, white collared shirt, Windows blue necktie, lapel stitching, and authentic Windows 4-pane logo enamel lapel pin.
  - Realistic hands with skin texture, fingernails, and suit/shirt cuffs resting naturally on the desk.
  - High-backed executive office chair with padded leather texture.
- Added dedicated 3-point lighting for the opponent: warm overhead key spotlight (`0xfff6ea`), cool Windows blue rim light (`0x0078d7`), and soft front fill light.
- Tuned camera framing and lowered background fog density so the opponent, revolver, and both monitors are crisp and clearly visible.
- Added dynamic defeat animation: opponent slumps and eyes shut on Windows death, resetting cleanly on restart.

## Enhancement: Widescreen Monitors & Peripherals per Person
- Upgraded monitors to widescreen displays with ultra-slim bezels covering ~95% of the front face ("more screen") with 16:10 aspect ratio (0.77m x 0.49m) and dedicated power LED indicators.
- Upgraded VirtualTerminal resolution to 768x480 with 22px monospace typography for maximum screen area and crisp readability.
- Added full peripheral sets for both players:
  - Mechanical keyboard with individual 3D beveled keycaps, spacebar, Enter key, and OS Super keys (Arch Linux Tux icon for player, Windows flag icon for bot), featuring theme-matched RGB underglow (green for Linux, blue for Windows).
  - Stitched gaming mousepad with theme edge stitching.
  - Ergonomic gaming mouse with scroll wheel and glowing RGB LED strip.
- Positioned the bot's hands and arms so their right hand rests naturally on their mouse and their left hand rests on their keyboard.

## Enhancement: The Dual-Boot Arbiter Console (Hacker Russian Roulette)
- Replaced the firearm revolver with an authentic, relatable computer/hacker game mechanic: **The Dual-Boot Arbiter Console** ("Push to Production / Sudo Roulette").
- In the center of the desk sits an industrial server-grade arbiter console with heavy braided conduits hardwired into both the Arch Linux rig and the Windows machine:
  - 6-LED rotary execution dial representing 6 execution slots (5 safe dry-runs, 1 fatal root purge).
  - Giant illuminated red emergency mechanical switch labeled `[ EXEC / SUDO ]`.
  - Status indicator plates for both machines (`LINUX (ROOT)` with green LED, `WINDOWS (SYSTEM)` with blue LED).
- On SPIN (`SPIN & EXEC`): Stepper motor sounds ratchet as the rotary dial spins and the 6 chamber LEDs strobe, re-randomizing the payload index.
- On EXECUTE:
  - The actor lifts their hand and slams the giant clacky mechanical switch down.
  - Safe execution: Tactile switch bottom-out `*CLACK*`, green safe flash, zero byte corruption, turn advances.
  - Fatal execution: High-voltage electrical arc explosion `*BOOM*`, spark bursts, console red flash, triggering the OS wipe sequence (`sudo rm -rf /*` -> Kernel Panic vs `del /f /s /q C:\*` -> BSOD).
- Bot animation: The Windows opponent lifts his left arm off the keyboard, hovers his hand directly over the big red button while delivering trash talk, and slams it down with physical impact.
- Audio synthesis: Tuned WebAudio oscillators for heavy tactile switch buckling spring snaps, stepper motor dial ticks, and capacitor arc blowouts.

## Enhancement: Realistic Articulated Hand & Biomechanical Animation
- **Procedural Canvas Textures for Player**:
  - High-resolution procedural skin canvas with warm tones, natural palm creases, shaded knuckle contours, and realistic fingernails with gloss highlights.
  - Dark charcoal hoodie fabric canvas with woven textile grid pattern and green seam stitching.
- **Articulated Skeletal Hand Rig**:
  - Built a hierarchical 3-level joint skeleton: `playerArmRig` -> `playerForearmGroup` -> `playerWristGroup` -> `playerPalm` with 5 independently articulated digits.
  - All 4 fingers (Index, Middle, Ring, Pinky) and Thumb are multi-jointed with base knuckle pivots and tip phalanx groups.
  - Implemented `setPlayerFingerPoses(curl, splay)` for natural anatomical hand postures (tight pinch, relaxed hold, open splay, impact flexion).
- **Realistic 6-Phase Biomechanical Animation**:
  1. *Arc Entrance*: Arm rises from off-screen in a curved biomechanical arc with fingers in a natural pinch grip securing the OS boot drive.
  2. *Docking Alignment & Slide*: Wrist tilts to align the drive with the dock; drive physically translates into the slot until it latches.
  3. *Finger Release & Lift*: Fingers uncurl smoothly to release the drive as the dock LED illuminates green; hand lifts away.
  4. *Open-Hand Transition & Hover*: Wrist cocks back ~25°, palm faces downward, fingers splay wide over the big red EXEC switch with high-tension micro-anticipation.
  5. *Windup & Dynamic Slam*: Hand executes a fast 2.5cm upward windup, then drives down with explosive acceleration onto the switch; fingers and wrist flex on impact to absorb force as the keycap bottoms out.
  6. *Natural Recovery*: Fingers relax into an anatomical resting curve as the arm smoothly swings back down to rest near the keyboard.










