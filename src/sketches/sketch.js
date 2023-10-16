'use strict';

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const p5 = require('p5');

const sketch = (p) => {
  /* 
  * p is a parameter that contains the p5 object.
  */

  let consoleLogs = [];
  const init_log = () => {
    // Override console.log to store messages
    let originalConsoleLog = console.log;
    console.log = function(message) {
      originalConsoleLog.apply(console, arguments);
      consoleLogs.push(message);
      const maxConsoleMessages = 10;
      if (consoleLogs.length > maxConsoleMessages) {
        consoleLogs.shift();
      }
    };
  }
  
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    init_log();
  };

  p.draw = () => {
    p.background(220);

    // Display the X and Y location of the mouse
    let mouseXPos = p.mouseX;
    let mouseYPos = p.mouseY;
    
    p.fill(0);
    p.textSize(16);
    p.text('MouseX: ' + mouseXPos, 20, 30);
    p.text('MouseY: ' + mouseYPos, 20, 50);

    // Display the last 10 lines of console information
    p.fill(0);
    p.textSize(12);
    for (let i = 0; i < consoleLogs.length; i++) {
      p.text(consoleLogs[i], 20, 70 + i * 20);
    }
    
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  }


 }


// Instantiates P5 sketch as an object to keep it out of the global scope.
const p5app = new p5(sketch);