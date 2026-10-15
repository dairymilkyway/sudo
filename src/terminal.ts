import * as THREE from 'three';

export interface TerminalOptions {
  width?: number;
  height?: number;
  bgColor: string;
  textColor: string;
  promptPrefix: string;
  fontSize?: number;
  osType?: 'linux' | 'windows';
}

export class VirtualTerminal {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private lines: string[] = [];
  private currentInput = '';
  private promptPrefix: string;
  private textColor: string;
  private bgColor: string;
  private fontSize: number;
  private width: number;
  private height: number;
  private maxLines: number;
  private cursorBlink = true;
  private lastBlinkTime = 0;
  private isTyping = false;
  private osType: 'linux' | 'windows';
  private contentStartY: number;

  constructor(options: TerminalOptions) {
    this.width = options.width || 768;
    this.height = options.height || 480;
    this.bgColor = options.bgColor;
    this.textColor = options.textColor;
    this.promptPrefix = options.promptPrefix;
    this.fontSize = options.fontSize || 20;
    this.osType = options.osType || 'linux';

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context for terminal');
    this.ctx = ctx;

    this.contentStartY = this.osType === 'linux' ? 72 : 46;
    const availableHeight = this.height - this.contentStartY - 16;
    this.maxLines = Math.floor(availableHeight / (this.fontSize + 6));

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    this.render();
  }

  public getTexture(): THREE.CanvasTexture {
    return this.texture;
  }

  public clear(): void {
    this.lines = [];
    this.currentInput = '';
    this.render();
  }

  public setPromptPrefix(prefix: string): void {
    this.promptPrefix = prefix;
    this.render();
  }

  public addLine(line: string): void {
    this.lines.push(line);
    if (this.lines.length > this.maxLines) {
      this.lines.shift();
    }
    this.render();
  }

  public async typeText(text: string, speedMs = 30, soundCallback?: () => void): Promise<void> {
    this.isTyping = true;
    for (let i = 0; i < text.length; i++) {
      this.currentInput += text[i];
      if (soundCallback && Math.random() > 0.4) {
        soundCallback();
      }
      this.render();
      await new Promise(r => setTimeout(r, speedMs));
    }
    this.isTyping = false;
  }

  public commitInput(echoPrompt = true): void {
    if (echoPrompt) {
      this.addLine(`${this.promptPrefix}${this.currentInput}`);
    } else {
      this.addLine(this.currentInput);
    }
    this.currentInput = '';
    this.render();
  }

  public updateCursor(time: number): void {
    if (time - this.lastBlinkTime > 500) {
      this.cursorBlink = !this.cursorBlink;
      this.lastBlinkTime = time;
      this.render();
    }
  }

  private drawLinuxChrome(): void {
    const ctx = this.ctx;
    const w = this.width;

    // 1. Top Waybar / Polybar status line (y: 0 - 30)
    ctx.fillStyle = '#0d131a';
    ctx.fillRect(0, 0, w, 30);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, 30);

    // Workspace indicators (left)
    ctx.fillStyle = '#22c55e'; // Active workspace green pill
    ctx.beginPath();
    ctx.roundRect(8, 5, 52, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('1:term', 14, 19);

    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText('2:code', 68, 19);
    ctx.fillText('3:web', 120, 19);

    // Center bar: System name
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('archbox • Linux 6.8.9-arch1-1 (x86_64)', w / 2, 19);

    // Right modules: CPU, RAM, clock
    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('CPU 12%  RAM 1.4G/16G  23:59:59', w - 12, 19);

    // 2. Terminal Window Header (y: 30 - 64)
    ctx.fillStyle = '#141e17';
    ctx.fillRect(0, 30, w, 34);
    ctx.strokeStyle = '#22c55e33';
    ctx.strokeRect(0, 30, w, 34);

    // Window controls dots (macOS/GNOME style)
    ctx.beginPath();
    ctx.arc(18, 47, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444'; // Close
    ctx.fill();

    ctx.beginPath();
    ctx.arc(36, 47, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#eab308'; // Minimize
    ctx.fill();

    ctx.beginPath();
    ctx.arc(54, 47, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e'; // Maximize
    ctx.fill();

    // Tab title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('bash — player@archbox: ~ (tty1)', 74, 52);
  }

  private drawWindowsChrome(): void {
    const ctx = this.ctx;
    const w = this.width;

    // Windows Terminal / CMD Title Bar (y: 0 - 36)
    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(0, 0, w, 36);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, 36);

    // Active Tab
    ctx.fillStyle = '#0c0c0c';
    ctx.fillRect(8, 4, 250, 32);
    ctx.strokeStyle = '#0078d7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, 4);
    ctx.lineTo(258, 4);
    ctx.stroke();

    // Command Prompt Icon & Title
    ctx.fillStyle = '#00a4ef';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('C:\\> ', 18, 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = '13px "Segoe UI", Tahoma, sans-serif';
    ctx.fillText('Administrator: Command Prompt', 54, 24);

    // Windows control buttons (right: _ □ ✕)
    const btnW = 44;
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';

    // Minimize
    ctx.fillText('🗕', w - btnW * 3 + btnW / 2, 23);
    // Maximize
    ctx.fillText('🗖', w - btnW * 2 + btnW / 2, 23);
    // Close
    ctx.fillText('✕', w - btnW + btnW / 2, 23);
  }

  public render(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Terminal inner background
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, w, h);

    // Draw realistic OS window chrome
    if (this.osType === 'linux') {
      this.drawLinuxChrome();
    } else {
      this.drawWindowsChrome();
    }

    // Terminal content clipping region
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, this.contentStartY, w, h - this.contentStartY);
    ctx.clip();

    // Monospace terminal text with phosphor glow
    ctx.fillStyle = this.textColor;
    ctx.font = `${this.fontSize}px 'Courier New', monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.shadowColor = this.osType === 'linux' ? 'rgba(51, 255, 102, 0.4)' : 'rgba(0, 164, 239, 0.4)';
    ctx.shadowBlur = 4;

    const lineHeight = this.fontSize + 6;
    let y = this.contentStartY + 10;

    // Draw previous log lines
    for (const line of this.lines) {
      if (line.startsWith('*BOOM*') || line.startsWith('BANG')) {
        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = 'rgba(255, 68, 68, 0.7)';
      } else if (line.startsWith('*CLACK*') || line.startsWith('*click*')) {
        ctx.fillStyle = '#55ff77';
        ctx.shadowColor = 'rgba(85, 255, 119, 0.6)';
      } else if (line.startsWith('[ACTION]') || line.startsWith('[DECISION]')) {
        ctx.fillStyle = this.osType === 'linux' ? '#f1fa8c' : '#ffd166';
        ctx.shadowColor = 'rgba(255, 209, 102, 0.5)';
      } else if (line.startsWith('"')) {
        ctx.fillStyle = '#ff79c6';
        ctx.shadowColor = 'rgba(255, 121, 198, 0.5)';
      } else {
        ctx.fillStyle = this.textColor;
        ctx.shadowColor = this.osType === 'linux' ? 'rgba(51, 255, 102, 0.35)' : 'rgba(0, 164, 239, 0.35)';
      }

      ctx.fillText(line, 16, y);
      y += lineHeight;
    }

    // Draw active prompt line with syntax styling
    const fullPrompt = `${this.promptPrefix}${this.currentInput}`;
    ctx.fillStyle = this.textColor;
    ctx.fillText(fullPrompt, 16, y);

    // Blinking cursor
    if (this.cursorBlink || this.isTyping) {
      const metrics = ctx.measureText(fullPrompt);
      const cursorX = 16 + metrics.width;
      ctx.fillStyle = this.osType === 'linux' ? '#50fa7b' : '#ffffff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 6;
      ctx.fillRect(cursorX, y + 2, this.fontSize * 0.55, this.fontSize);
    }

    ctx.restore();

    // Subtle phosphor scanline raster
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    for (let scanY = 0; scanY < h; scanY += 3) {
      ctx.fillRect(0, scanY, w, 1);
    }

    // CRT monitor glass curvature inner vignette
    const gradVignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.7);
    gradVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradVignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = gradVignette;
    ctx.fillRect(0, 0, w, h);

    // CRT glass diagonal glare reflection (top-right highlight)
    const glare = ctx.createLinearGradient(0, 0, w, h);
    glare.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    glare.addColorStop(0.3, 'rgba(255, 255, 255, 0.01)');
    glare.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glare;
    ctx.fillRect(0, 0, w, h);

    this.texture.needsUpdate = true;
  }
}
