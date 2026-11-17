// Keyboard + pointer input: held keys, one-shot presses and mouse position.
// Every system reads input through this object so the binding lives in one place.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.pressed = new Set(); // keys pressed since the last frame
    this.mouse = { x: canvas.width / 2, y: canvas.height / 2, clicked: false };

    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (!this.down.has(key)) this.pressed.add(key);
      this.down.add(key);
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
    });
    window.addEventListener('keyup', (event) => {
      this.down.delete(event.key.toLowerCase());
    });
    canvas.addEventListener('mousemove', (event) => {
      const box = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - box.left) / box.width) * canvas.width;
      this.mouse.y = ((event.clientY - box.top) / box.height) * canvas.height;
    });
    canvas.addEventListener('mousedown', () => {
      this.mouse.clicked = true;
    });
  }

  // is a key held right now
  held(...keys) {
    return keys.some((key) => this.down.has(key));
  }

  // was a key pressed since the last frame
  hit(...keys) {
    return keys.some((key) => this.pressed.has(key));
  }

  // clear one-shot state at the end of a frame
  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}
