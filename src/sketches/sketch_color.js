'use strict';

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const p5 = require('p5');
const { getFillColor } = require('./js/src/colorController');

const sketch = (p) => {
  // p is a parameter that contains the p5 object.
  
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
  };

  p.draw = () => {
    let fillColor = getFillColor(p.mouseIsPressed);
    p.fill(fillColor)

    p.ellipse(p.mouseX, p.mouseY, 80, 80);
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  }
}

// Instantiates P5 sketch as an object to keep it out of the global scope.
const app = new p5(sketch);