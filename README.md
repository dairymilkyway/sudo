# sudo (Kernel Roulette)

A 3D retro-cyberpunk browser game where an Arch Linux hacker faces off against a corporate Windows executive in a deadly, high-stakes game of OS Russian Roulette using the **Dual-Boot Arbiter Console**.

Whoever triggers the fatal execution payload runs their OS wipe command and perishes in an authentic, screen-melting system crash:
- **Arch Linux:** types `sudo rm -rf /*`, suffers filesystem corruption, kernel panic, and drops to an interactive `grub rescue>` terminal where typing `reboot` restarts the machine.
- **Windows:** executes `del /f /s /q C:\*`, deletes System32 components in real time, and triggers an authentic full-screen Blue Screen of Death (`:(`, 0-100% crash dump counter, and stop code `KERNEL_ROULETTE_FATAL`).

> **Zero external assets, zero heavy backend, zero audio/model downloads.** Everything is rendered client-side in the browser using vanilla Three.js, procedural HTML5 canvas textures, WebAudio oscillator synthesizers, and immersive diegetic CRT overlays.

---

## Game Overview & Mechanics

- **The Dual-Boot Arbiter Console:** An industrial server rack console sitting between both players, wired directly into both motherboards. It features a 6-slot rotary dial and an illuminated industrial mechanical `[ EXEC / SUDO ]` slam switch.
- **The Stakes (5 Safe / 1 Fatal):** Out of 6 execution slots, 5 are harmless dry-runs and 1 carries a fatal root wipe payload.
- **Actions:**
  - **Execute / Sudo (`[ EXECUTE ]`):** Slam the emergency switch. If safe, you survive and pass the turn. If fatal, your machine is bricked.
  - **Spin & Execute (`[ SPIN & EXEC ]`):** Re-randomize the payload index across the rotary dial before committing your turn.
- **Fully Articulated First-Person Hands & Glove:** Procedural tactical carbon-knuckle hacker glove with continuous spline animations, key presses, switch slams, and natural recoil.
- **Reactive 3D Opponent & AI:** Corporate executive opponent with procedurally generated facial features, eye blinking, subtle breathing, procedural suit & Windows pin, dynamic arm animations, and trash-talk terminal dialogues based on calculated survival odds.
- **Authentic Dual CRTs & Peripherals:** High-res widescreen CRT monitors with phosphor scanlines, typewriter line scroll, mechanical keyboards with RGB underglow, stitched gaming mousepads, and optical mice.
- **Procedural Audio Synthesizer:** Real-time WebAudio synthesis with zero MP3/WAV files—buckling spring key clicks, stepper motor ratchet spins, capacitor discharge booms, and glitch crackles.

---

## Tech Stack

- **Core & Build:** Vite, TypeScript
- **3D Graphics:** Vanilla Three.js (no React, no external 3D models or physics dependencies)
- **Displays & Terminals:** HTML5 Canvas-backed dynamic `THREE.CanvasTexture` CRT raster displays
- **Audio:** Custom WebAudio API procedural sound synthesizers
- **Crash Overlays:** Monospace Kernel Panic + GRUB rescue prompt & Windows 10/11 BSOD

---

## License

MIT
