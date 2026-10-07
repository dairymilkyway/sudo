import * as THREE from 'three';

export interface TerminalOptions {
  width?: number;
  height?: number;
  bgColor: string;
  textColor: string;
  promptPrefix: string;
  fontSize?: number;
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

  constructor(options: TerminalOptions) {
    this.width = options.width || 512;
    this.height = options.height || 384;
    this.bgColor = options.bgColor;
    this.textColor = options.textColor;
    this.promptPrefix = options.promptPrefix;
    this.fontSize = options.fontSize || 18;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context for terminal');
    this.ctx = ctx;

    this.maxLines = Math.floor((this.height - 30) / (this.fontSize + 6));

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

  public render(): void {
    // Background CRT screen fill
    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle scanline overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < this.height; y += 4) {
      this.ctx.fillRect(0, y, this.width, 2);
    }

    // Monospace terminal text
    this.ctx.fillStyle = this.textColor;
    this.ctx.font = `${this.fontSize}px 'Courier New', monospace`;
    this.ctx.textBaseline = 'top';

    const lineHeight = this.fontSize + 6;
    let y = 16;

    // Draw previous lines
    for (const line of this.lines) {
      this.ctx.fillText(line, 16, y);
      y += lineHeight;
    }

    // Draw active prompt line
    const activeText = `${this.promptPrefix}${this.currentInput}`;
    this.ctx.fillText(activeText, 16, y);

    // Draw cursor
    if (this.cursorBlink || this.isTyping) {
      const metrics = this.ctx.measureText(activeText);
      const cursorX = 16 + metrics.width;
      this.ctx.fillRect(cursorX, y + 2, this.fontSize * 0.55, this.fontSize);
    }

    this.texture.needsUpdate = true;
  }
}
