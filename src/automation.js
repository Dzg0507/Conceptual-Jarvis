const { mouse, keyboard, Point, Button } = require('@nut-tree-fork/nut-js');

// Configure nut.js to have a delay between commands
mouse.config.autoDelayMs = 100;
keyboard.config.autoDelayMs = 100;

/**
 * Clicks the mouse at a specific point.
 * @param {object} point - An object with x and y coordinates.
 */
async function clickAt(point) {
  await mouse.setPosition(new Point(point.x, point.y));
  await mouse.click(Button.LEFT);
}

/**
 * Types a given string.
 * @param {string} text - The text to type.
 */
async function typeText(text) {
  await keyboard.type(text);
}

module.exports = {
  clickAt,
  typeText,
};
