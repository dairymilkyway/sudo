import { VirtualTerminal } from './terminal';
import { SoundFX } from './audio';

export interface DeathHandlerOptions {
  container: HTMLElement;
  playerTerminal: VirtualTerminal;
  botTerminal: VirtualTerminal;
  soundFX: SoundFX;
  setCameraShake: (intensity: number) => void;
  onRestart: () => void;
}

export class DeathManager {
  private container: HTMLElement;
  private playerTerminal: VirtualTerminal;
  private botTerminal: VirtualTerminal;
  private soundFX: SoundFX;
  private setCameraShake: (intensity: number) => void;
  private onRestart: () => void;

  constructor(options: DeathHandlerOptions) {
    this.container = options.container;
    this.playerTerminal = options.playerTerminal;
    this.botTerminal = options.botTerminal;
    this.soundFX = options.soundFX;
    this.setCameraShake = options.setCameraShake;
    this.onRestart = options.onRestart;
  }

  /**
   * Linux Death Sequence
   * 1. Terminal types `$ sudo rm -rf /*`
   * 2. `[sudo] password for player:` auto-filled with dots.
   * 3. 2 seconds: fake removed paths scroll fast, desktop elements vanish, flicker, audio crackle.
   * 4. Cut to black screen with Kernel panic stack trace.
   * 5. 3s later: drop to `grub rescue>` prompt. Typing 'reboot' restarts game.
   */
  public async triggerLinuxDeath(): Promise<void> {
    this.soundFX.playBang();
    this.setCameraShake(0.12);

    await new Promise(r => setTimeout(r, 800));

    // 1. Terminal command
    await this.playerTerminal.typeText('sudo rm -rf /* --no-preserve-root', 40, () => this.soundFX.playKeyClick());
    this.playerTerminal.commitInput(true);
    await new Promise(r => setTimeout(r, 400));

    // 2. Password prompt
    this.playerTerminal.addLine('[sudo] password for player: ••••••••••••');
    await new Promise(r => setTimeout(r, 500));

    // 3. Fake wipe fast scroll & screen disintegration overlay
    const wipeOverlay = document.createElement('div');
    wipeOverlay.className = 'linux-wipe-overlay';
    wipeOverlay.innerHTML = `
      <div class="fake-desktop">
        <div class="taskbar"><div class="start-btn">⚙ Arch</div><div class="clock">23:59:59</div></div>
        <div class="icons">
          <div class="icon" id="ic-term">💻 Terminal</div>
          <div class="icon" id="ic-home">📁 Home</div>
          <div class="icon" id="ic-trash">🗑️ Trash</div>
          <div class="icon" id="ic-kernel">🐧 vmlinuz</div>
        </div>
      </div>
    `;
    this.container.appendChild(wipeOverlay);

    const removePaths = [
      "removed '/usr/bin/bash'",
      "removed '/usr/bin/sudo'",
      "removed '/etc/fstab'",
      "removed '/etc/shadow'",
      "removed '/boot/vmlinuz-linux'",
      "removed '/boot/initramfs-linux.img'",
      "removed '/lib/modules/6.8.9-arch1/kernel'",
      "removed '/var/log/pacman.log'",
      "removed '/sys/fs/cgroup/memory'",
      "removed '/dev/null'",
      "removed '/bin/systemd'"
    ];

    const icons = wipeOverlay.querySelectorAll('.icon');
    let iconIdx = 0;

    for (let i = 0; i < 18; i++) {
      const p = removePaths[i % removePaths.length];
      this.playerTerminal.addLine(p);
      this.soundFX.playGlitchCrackle();
      this.setCameraShake(0.04);

      if (i % 4 === 0 && iconIdx < icons.length) {
        (icons[iconIdx] as HTMLElement).style.opacity = '0';
        (icons[iconIdx] as HTMLElement).style.transform = 'scale(0.5)';
        iconIdx++;
      }

      await new Promise(r => setTimeout(r, 90));
    }

    await new Promise(r => setTimeout(r, 500));
    wipeOverlay.remove();

    // 4. Black screen Kernel Panic overlay
    const panicOverlay = document.createElement('div');
    panicOverlay.className = 'kernel-panic-screen';
    panicOverlay.innerHTML = `
      <div class="panic-content">
        <p>[    1.439012] Kernel panic - not syncing: Attempted to kill init! exitcode=0x00000009</p>
        <p>[    1.439055] CPU: 0 PID: 1 Comm: systemd Tainted: G        W          6.8.9-arch1 #1</p>
        <p>[    1.439089] Hardware name: RouletteBox x86_64 / DeskEdition, BIOS v1.0.0</p>
        <p>[    1.439120] Call Trace:</p>
        <p>[    1.439145]  <TASK></p>
        <p>[    1.439170]  dump_stack_lvl+0x48/0x70</p>
        <p>[    1.439201]  panic+0x312/0x350</p>
        <p>[    1.439230]  do_exit+0x8f2/0x9e0</p>
        <p>[    1.439258]  do_group_exit+0x31/0x80</p>
        <p>[    1.439285]  __x64_sys_exit_group+0x18/0x20</p>
        <p>[    1.439315]  do_syscall_64+0x7b/0x140</p>
        <p>[    1.439345]  entry_SYSCALL_64_after_hwframe+0x76/0x7e</p>
        <p>[    1.439380] ---[ end Kernel panic - not syncing: Attempted to kill init! ]---</p>
        <div id="grub-prompt" class="grub-prompt" style="display: none; margin-top: 30px;">
          <p>error: no such partition.</p>
          <p>Entering rescue mode...</p>
          <div class="input-line">
            <span>grub rescue&gt; </span>
            <input type="text" id="grub-input" autocomplete="off" autofocus spellcheck="false" />
          </div>
          <div class="hint" id="grub-hint">(Type <span id="hint-click">reboot</span> and press Enter to restart)</div>
        </div>
      </div>
    `;
    this.container.appendChild(panicOverlay);

    // 5. After 3 seconds, drop to grub rescue prompt
    await new Promise(r => setTimeout(r, 3000));
    const grubDiv = panicOverlay.querySelector('#grub-prompt') as HTMLElement;
    const grubInput = panicOverlay.querySelector('#grub-input') as HTMLInputElement;
    const hintClick = panicOverlay.querySelector('#hint-click') as HTMLElement;

    if (grubDiv && grubInput) {
      grubDiv.style.display = 'block';
      grubInput.focus();

      hintClick.addEventListener('click', () => {
        grubInput.value = 'reboot';
        grubInput.focus();
      });

      grubInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = grubInput.value.trim().toLowerCase();
          if (val === 'reboot' || val === 'restart') {
            panicOverlay.remove();
            this.onRestart();
          } else {
            const errP = document.createElement('p');
            errP.textContent = `Unknown command '${val}'. Try 'reboot'`;
            grubDiv.insertBefore(errP, grubDiv.querySelector('.input-line'));
            grubInput.value = '';
          }
        }
      });
    }
  }

  /**
   * Windows Bot Death Sequence
   * 1. Bot terminal types `C:\> del /f /s /q C:\*`
   * 2. Scrolling `Deleted file - C:\Windows\System32\...`
   * 3. Hard cut to BSOD: `#0078d7`, :(, 0 to 100% counter, KERNEL_ROULETTE_FATAL.
   * 4. Camera push in, "YOU SURVIVED" banner and Play Again button.
   */
  public async triggerWindowsDeath(): Promise<void> {
    this.soundFX.playBang();
    this.setCameraShake(0.12);

    await new Promise(r => setTimeout(r, 800));

    // 1. Bot types wipe command
    await this.botTerminal.typeText('del /f /s /q C:\\*', 40);
    this.botTerminal.commitInput(true);
    await new Promise(r => setTimeout(r, 400));

    // 2. Scrolling deleted files
    const delFiles = [
      'Deleted file - C:\\Windows\\System32\\ntoskrnl.exe',
      'Deleted file - C:\\Windows\\System32\\hal.dll',
      'Deleted file - C:\\Windows\\System32\\win32k.sys',
      'Deleted file - C:\\Windows\\System32\\drivers\\disk.sys',
      'Deleted file - C:\\Windows\\System32\\config\\SYSTEM',
      'Deleted file - C:\\Windows\\System32\\cmd.exe',
      'Deleted file - C:\\Windows\\explorer.exe'
    ];

    for (let i = 0; i < 14; i++) {
      this.botTerminal.addLine(delFiles[i % delFiles.length]);
      this.soundFX.playGlitchCrackle();
      this.setCameraShake(0.035);
      await new Promise(r => setTimeout(r, 90));
    }

    await new Promise(r => setTimeout(r, 600));

    // 3. Full-screen BSOD overlay
    const bsodOverlay = document.createElement('div');
    bsodOverlay.className = 'bsod-screen';
    bsodOverlay.innerHTML = `
      <div class="bsod-content">
        <div class="frowny">:(</div>
        <div class="bsod-title">Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.</div>
        <div class="bsod-percent"><span id="bsod-count">0</span>% complete</div>
        <div class="bsod-details">
          <div class="qr-mock"></div>
          <div class="stopcode">
            <p>For more information about this issue and possible fixes, visit https://windows.com/stopcode</p>
            <p>If you call a support person, give them this info:</p>
            <p><strong>Stop code: KERNEL_ROULETTE_FATAL</strong></p>
          </div>
        </div>
      </div>
      <div class="victory-banner" id="victory-banner" style="display: none;">
        <h2>YOU SURVIVED</h2>
        <p>The Windows machine suffered critical system corruption.</p>
        <button id="btn-play-again" class="btn-action">PLAY AGAIN</button>
      </div>
    `;
    this.container.appendChild(bsodOverlay);

    const countSpan = bsodOverlay.querySelector('#bsod-count') as HTMLElement;
    const banner = bsodOverlay.querySelector('#victory-banner') as HTMLElement;
    const playAgainBtn = bsodOverlay.querySelector('#btn-play-again') as HTMLButtonElement;

    // Progress counter 0 to 100%
    let percent = 0;
    const interval = setInterval(() => {
      percent += Math.floor(Math.random() * 15) + 5;
      if (percent >= 100) {
        percent = 100;
        clearInterval(interval);
        if (countSpan) countSpan.textContent = '100';
        setTimeout(() => {
          if (banner) banner.style.display = 'flex';
        }, 800);
      } else {
        if (countSpan) countSpan.textContent = String(percent);
      }
    }, 180);

    playAgainBtn.addEventListener('click', () => {
      bsodOverlay.remove();
      this.onRestart();
    });
  }
}
