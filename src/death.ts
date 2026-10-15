import { VirtualTerminal } from './terminal';
import { SoundFX } from './audio';

export interface DeathHandlerOptions {
  container: HTMLElement;
  playerTerminal: VirtualTerminal;
  botTerminal: VirtualTerminal;
  soundFX: SoundFX;
  setCameraShake: (intensity: number) => void;
  onRestart: () => void;
  onMenu?: () => void;
}

export class DeathManager {
  private container: HTMLElement;
  private playerTerminal: VirtualTerminal;
  private botTerminal: VirtualTerminal;
  private soundFX: SoundFX;
  private setCameraShake: (intensity: number) => void;
  private onRestart: () => void;
  private onMenu?: () => void;

  constructor(options: DeathHandlerOptions) {
    this.container = options.container;
    this.playerTerminal = options.playerTerminal;
    this.botTerminal = options.botTerminal;
    this.soundFX = options.soundFX;
    this.setCameraShake = options.setCameraShake;
    this.onRestart = options.onRestart;
    this.onMenu = options.onMenu;
  }

  /**
   * Linux Cascade Kernel Annihilation Sequence
   * Zero emojis. Authentic kernel panic, memory corruption stream, analog CRT raster collapse,
   * synthesized capacitor discharge, and interactive GRUB recovery.
   */
  public async triggerLinuxDeath(victim: 'player' | 'bot' = 'player'): Promise<void> {
    this.soundFX.playBang();
    this.setCameraShake(0.18);

    const term = victim === 'player' ? this.playerTerminal : this.botTerminal;

    await new Promise(r => setTimeout(r, 600));

    // 1. Terminal wipe command
    await term.typeText('sudo rm -rf /* --no-preserve-root', 35, () => this.soundFX.playKeyClick());
    term.commitInput(true);
    await new Promise(r => setTimeout(r, 300));

    // 2. Sudo prompt
    term.addLine('[sudo] password for root: ••••••••••••');
    await new Promise(r => setTimeout(r, 400));

    // 3. Fast corruption & memory leak stream
    const wipeLines = [
      "removed '/boot/vmlinuz-linux'",
      "removed '/boot/initramfs-linux.img'",
      "removed '/etc/fstab'",
      "removed '/etc/shadow'",
      "0x7fff5fbff8b0: 0xDEADBEEF 0x00000000 0xBAADF00D",
      "removed '/lib/modules/6.8.9-arch1/kernel'",
      "PAGE_FAULT_IN_NONPAGED_AREA at 0xffff888002a4b000",
      "removed '/sys/fs/cgroup/memory'",
      "CR4: 00000000000006f0 CR0: 0000000080050033",
      "removed '/dev/nvme0n1p2'",
      "---[ RIP: 0010:do_syscall_64+0x7b/0x140 ]---",
      "removed '/sbin/init'",
      "Kernel panic - not syncing: Attempted to kill init!"
    ];

    for (let i = 0; i < wipeLines.length; i++) {
      term.addLine(wipeLines[i]);
      this.soundFX.playGlitchCrackle();
      this.setCameraShake(0.04);
      await new Promise(r => setTimeout(r, 70));
    }

    await new Promise(r => setTimeout(r, 350));

    // 4. Analog CRT Raster Collapse Overlay
    this.soundFX.playCRTRasterCollapse();
    const crtCollapse = document.createElement('div');
    crtCollapse.className = 'crt-raster-collapse-screen';
    crtCollapse.innerHTML = `
      <div class="raster-beam-slit"></div>
      <div class="raster-chroma-tear"></div>
    `;
    this.container.appendChild(crtCollapse);

    if (victim === 'bot') {
      // Opponent slams forward onto desk
      setTimeout(() => {
        this.soundFX.playOpponentDeskSlap();
        this.setCameraShake(0.18);
      }, 400);
    }

    await new Promise(r => setTimeout(r, 1200));
    crtCollapse.remove();

    // 5. Outcome Screen
    if (victim === 'player') {
      // Player died as Linux: Show pure kernel panic and drop to GRUB rescue
      const panicOverlay = document.createElement('div');
      panicOverlay.className = 'kernel-panic-screen';
      panicOverlay.innerHTML = `
        <div class="panic-content">
          <p class="panic-header">[    1.439012] Kernel panic - not syncing: Attempted to kill init! exitcode=0x00000009</p>
          <p>[    1.439055] CPU: 0 PID: 1 Comm: systemd Tainted: G        W          6.8.9-arch1 #1</p>
          <p>[    1.439089] Hardware name: RouletteBox x86_64 / DeskEdition, BIOS v2.4-FATAL</p>
          <p>[    1.439120] Call Trace:</p>
          <p>[    1.439145]  &lt;TASK&gt;</p>
          <p>[    1.439170]  dump_stack_lvl+0x48/0x70</p>
          <p>[    1.439201]  panic+0x312/0x350</p>
          <p>[    1.439230]  do_exit+0x8f2/0x9e0</p>
          <p>[    1.439258]  do_group_exit+0x31/0x80</p>
          <p>[    1.439285]  __x64_sys_exit_group+0x18/0x20</p>
          <p>[    1.439315]  do_syscall_64+0x7b/0x140</p>
          <p>[    1.439345]  entry_SYSCALL_64_after_hwframe+0x76/0x7e</p>
          <p>[    1.439380] ---[ end Kernel panic - not syncing: Attempted to kill init! ]---</p>
          <div id="grub-prompt" class="grub-prompt" style="display: none; margin-top: 28px;">
            <p style="color: #ef4444; font-weight: bold;">error: no such partition.</p>
            <p>Entering rescue mode...</p>
            <div class="input-line">
              <span class="grub-tag">grub rescue&gt; </span>
              <input type="text" id="grub-input" autocomplete="off" autofocus spellcheck="false" />
            </div>
            <div class="grub-actions">
              <button id="btn-grub-reboot" class="btn-diegetic">REBOOT SYSTEM</button>
              <button id="btn-grub-menu" class="btn-diegetic">RETURN TO BIOS</button>
            </div>
            <div class="hint">(Type <strong>reboot</strong> or click above to restart partition)</div>
          </div>
        </div>
      `;
      this.container.appendChild(panicOverlay);

      await new Promise(r => setTimeout(r, 1800));
      const grubDiv = panicOverlay.querySelector('#grub-prompt') as HTMLElement;
      const grubInput = panicOverlay.querySelector('#grub-input') as HTMLInputElement;
      const btnReboot = panicOverlay.querySelector('#btn-grub-reboot') as HTMLButtonElement;
      const btnMenu = panicOverlay.querySelector('#btn-grub-menu') as HTMLButtonElement;

      if (grubDiv && grubInput) {
        grubDiv.style.display = 'block';
        grubInput.focus();

        const triggerRestart = () => {
          this.soundFX.playRelayClick();
          panicOverlay.remove();
          this.onRestart();
        };

        const triggerMenu = () => {
          this.soundFX.playRelayClick();
          panicOverlay.remove();
          if (this.onMenu) this.onMenu();
          else this.onRestart();
        };

        btnReboot.addEventListener('click', triggerRestart);
        btnMenu.addEventListener('click', triggerMenu);

        grubInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const val = grubInput.value.trim().toLowerCase();
            if (val === 'reboot' || val === 'restart' || val === 'boot' || val === 'exit') {
              triggerRestart();
            } else if (val === 'bios' || val === 'menu') {
              triggerMenu();
            } else {
              const errP = document.createElement('p');
              errP.textContent = `Unknown command '${val}'. Try 'reboot' or 'bios'`;
              errP.style.color = '#ef4444';
              grubDiv.insertBefore(errP, grubDiv.querySelector('.input-line'));
              grubInput.value = '';
            }
          }
        });
      }
    } else {
      // Bot died as Linux (Player is Windows and won!)
      const victoryOverlay = document.createElement('div');
      victoryOverlay.className = 'telemetry-victory-screen';
      victoryOverlay.innerHTML = `
        <div class="telemetry-panel">
          <div class="panel-header">
            <span class="status-dot green"></span>
            <span>SYSTEM TELEMETRY // VICTORY VERIFIED</span>
          </div>
          <div class="panel-body">
            <h2>TARGET LINUX KERNEL ANNIHILATED</h2>
            <p>Hostile Arch Linux instance has suffered fatal root wipe & init panic.</p>
            <p class="stats-line">DUAL-BOOT ARBITER: <strong>MASTER BOOT RECORD SECURED</strong></p>
            <div class="telemetry-actions">
              <button id="btn-vic-restart" class="btn-diegetic primary">PLAY NEXT ROUND</button>
              <button id="btn-vic-menu" class="btn-diegetic secondary">BOOTLOADER MENU</button>
            </div>
          </div>
        </div>
      `;
      this.container.appendChild(victoryOverlay);

      const btnRestart = victoryOverlay.querySelector('#btn-vic-restart') as HTMLButtonElement;
      const btnMenu = victoryOverlay.querySelector('#btn-vic-menu') as HTMLButtonElement;

      btnRestart.addEventListener('click', () => {
        this.soundFX.playRelayClick();
        victoryOverlay.remove();
        this.onRestart();
      });

      btnMenu.addEventListener('click', () => {
        this.soundFX.playRelayClick();
        victoryOverlay.remove();
        if (this.onMenu) this.onMenu();
        else this.onRestart();
      });
    }
  }

  /**
   * Windows Catastrophic Freeze & BSOD Sequence
   * Authentic Segoe UI, 100Hz audio buffer freeze buzz ("BRRRRRRR"), screen stutter,
   * erratic memory dump counter, and physical opponent collapse.
   */
  public async triggerWindowsDeath(victim: 'player' | 'bot' = 'bot'): Promise<void> {
    this.soundFX.playBang();
    this.setCameraShake(0.18);

    const term = victim === 'player' ? this.playerTerminal : this.botTerminal;

    await new Promise(r => setTimeout(r, 600));

    // 1. Wipe command
    await term.typeText('del /f /s /q C:\\* & bcdedit /delete {current}', 35);
    term.commitInput(true);
    await new Promise(r => setTimeout(r, 300));

    // 2. Scrolling deleted files
    const delFiles = [
      'Deleted file - C:\\Windows\\System32\\ntoskrnl.exe',
      'Deleted file - C:\\Windows\\System32\\hal.dll',
      'Deleted file - C:\\Windows\\System32\\win32k.sys',
      'Deleted file - C:\\Windows\\System32\\drivers\\disk.sys',
      'Deleted file - C:\\Windows\\System32\\config\\SYSTEM',
      'Deleted file - C:\\Windows\\System32\\cmd.exe',
      'Deleted file - C:\\Windows\\Boot\\BCD',
      'Deleted file - C:\\Windows\\explorer.exe'
    ];

    for (let i = 0; i < delFiles.length; i++) {
      term.addLine(delFiles[i]);
      this.soundFX.playGlitchCrackle();
      this.setCameraShake(0.035);
      await new Promise(r => setTimeout(r, 70));
    }

    // 3. Audio crash freeze loop & screen stutter
    this.soundFX.playBSODAudioFreeze(1800);
    this.setCameraShake(0.08);

    if (victim === 'bot') {
      setTimeout(() => {
        this.soundFX.playOpponentDeskSlap();
        this.setCameraShake(0.18);
      }, 500);
    }

    await new Promise(r => setTimeout(r, 700));

    // 4. Authentic Windows 11 BSOD screen
    const bsodOverlay = document.createElement('div');
    bsodOverlay.className = 'bsod-screen';
    bsodOverlay.innerHTML = `
      <div class="bsod-content">
        <div class="frowny">:(</div>
        <div class="bsod-title">Your device ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.</div>
        <div class="bsod-percent"><span id="bsod-count">0</span>% complete</div>
        <div class="bsod-details">
          <div class="qr-mock"></div>
          <div class="stopcode">
            <p>For more information about this issue and possible fixes, visit https://windows.com/stopcode</p>
            <p>If you call a support person, give them this info:</p>
            <p><strong>Stop code: KERNEL_SECURITY_CHECK_FAILURE</strong></p>
            <p><strong>What failed: arbiter_dualboot.sys (0x00000139)</strong></p>
          </div>
        </div>
      </div>
      <div class="bsod-actions-panel" id="bsod-actions" style="display: none;">
        <div class="telemetry-panel ${victim === 'player' ? 'danger' : ''}">
          <div class="panel-header">
            <span class="status-dot ${victim === 'player' ? 'red' : 'green'}"></span>
            <span>${victim === 'player' ? 'AUTOMATIC REPAIR FAILED' : 'SYSTEM TELEMETRY // VICTORY VERIFIED'}</span>
          </div>
          <div class="panel-body">
            <h2>${victim === 'player' ? 'WINDOWS SYSTEM CORRUPTED' : 'TARGET WINDOWS INSTANCE DELETED'}</h2>
            <p>${victim === 'player' ? 'Your PC did not start correctly. The Master Boot Record was purged.' : 'The corporate Windows machine experienced fatal unrecoverable bugcheck.'}</p>
            <div class="telemetry-actions">
              <button id="btn-bsod-restart" class="btn-diegetic primary">${victim === 'player' ? 'REBOOT SYSTEM' : 'PLAY NEXT ROUND'}</button>
              <button id="btn-bsod-menu" class="btn-diegetic secondary">BOOTLOADER MENU</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.container.appendChild(bsodOverlay);

    const countSpan = bsodOverlay.querySelector('#bsod-count') as HTMLElement;
    const actionsPanel = bsodOverlay.querySelector('#bsod-actions') as HTMLElement;
    const btnRestart = bsodOverlay.querySelector('#btn-bsod-restart') as HTMLButtonElement;
    const btnMenu = bsodOverlay.querySelector('#btn-bsod-menu') as HTMLButtonElement;

    // Realistic erratic memory dump counter (0% -> 18% -> 47% -> 83% -> 100%)
    const jumps = [0, 18, 35, 47, 62, 83, 94, 100];
    let jumpIdx = 0;

    const interval = setInterval(() => {
      jumpIdx++;
      if (jumpIdx >= jumps.length) {
        clearInterval(interval);
        if (countSpan) countSpan.textContent = '100';
        setTimeout(() => {
          if (actionsPanel) actionsPanel.style.display = 'flex';
        }, 700);
      } else {
        if (countSpan) countSpan.textContent = String(jumps[jumpIdx]);
      }
    }, 220);

    btnRestart.addEventListener('click', () => {
      this.soundFX.playRelayClick();
      bsodOverlay.remove();
      this.onRestart();
    });

    btnMenu.addEventListener('click', () => {
      this.soundFX.playRelayClick();
      bsodOverlay.remove();
      if (this.onMenu) this.onMenu();
      else this.onRestart();
    });
  }
}
