/**
 * AURORA EFFECT
 * Canvas-based particle system with glow (northern lights style)
 */

class AuroraEffect {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationFrame = null;
  }

  trigger(element) {
    this._createCanvas(element);
    this._generateParticles();
    this._animate();
    
    setTimeout(() => this._destroy(), 1500);
  }

  _createCanvas(element) {
    const rect = element.getBoundingClientRect();
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.canvas.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      pointer-events: none;
      z-index: 100;
      border-radius: inherit;
    `;
    
    element.style.position = 'relative';
    element.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  _generateParticles() {
    const colors = [
      { r: 100, g: 255, b: 200 }, // cyan
      { r: 150, g: 200, b: 255 }, // blue
      { r: 200, g: 150, b: 255 }, // purple
      { r: 100, g: 255, b: 150 }  // green
    ];
    
    // Reduce particles on mobile
    const count = window.matchMedia('(max-width: 768px)').matches ? 20 : 30;
    
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 2,
        color: color,
        opacity: Math.random() * 0.8 + 0.2,
        life: 1.0
      });
    }
  }

  _animate() {
    const draw = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.particles.forEach(p => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.015;
        p.opacity = p.life * 0.8;
        
        // Glow effect
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity})`;
        
        // Draw particle
        this.ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Wave trail
        this.ctx.shadowBlur = 8;
        this.ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity * 0.3})`;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x - p.vx * 5, p.y - p.vy * 5);
        this.ctx.stroke();
      });
      
      if (this.particles.some(p => p.life > 0)) {
        this.animationFrame = requestAnimationFrame(draw);
      }
    };
    
    draw();
  }

  _destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
  }
}

if (typeof window !== 'undefined') {
  window.AuroraEffect = AuroraEffect;
}
