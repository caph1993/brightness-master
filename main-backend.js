//@ts-check
const { spawnSync } = require('child_process');
const { existsSync, readFileSync, writeFileSync } = require('fs');


const loadJSON = (/**@type {string}*/filename) => {
  const path = `${__dirname}/${filename}`;
  let obj = {};
  try {
    obj = JSON.parse('' + readFileSync(path));
  } catch (err) {
    if (!existsSync(path)) writeFileSync(path, JSON.stringify(obj))
    else {
      console.error(`Invalid JSON in ${filename}, full path and error below:\n${path}\n${err}`);
    }
  }
  // make sure it's a key-value mapping:

  return obj;
}

const config = {
  curveCentroid: 0.3,
  minBrightness: 0.00008,
  brightnessAccel: 0.3,
  brightnessHoldStep: 0.005,
  brightnessHoldMaxStep: 0.25,
  brightnessStep: 0.005,
}
const state = { t: 0, brightness: -1, brightness2: -1, max: -1, speed: 1, held: false };

// Brightness curves:

/**@param {number} x*/
const linear = (x, { x0 = 0, x1 = 1, y0 = 0, y1 = 1 } = {}) => (x - x0) / (x1 - x0) * (y1 - y0) + y0;
/**@param {number} y*/
const linearInv = (y, { x0 = 0, x1 = 1, y0 = 0, y1 = 1 } = {}) => (y - y0) / (y1 - y0) * (x1 - x0) + x0;


/**@param {number} x @param {number} k*/
const _linearFractional = (x, k) => (x + k) / (1 + k * x);

/**@param {number} x @param {number} k*/
const _linearFractional01 = (x, k) => (_linearFractional(x * 2 - 1, k * 2 - 1) + 1) / 2;

/**@param {number} x*/
const brightnessCurve = (x) => linear(_linearFractional01(x, config.curveCentroid), { y0: config.minBrightness });

/**@param {number} y*/
const brightnessCurveInv = (y) => _linearFractional01(linearInv(y, { y0: config.minBrightness }), 1 - config.curveCentroid);

// brightnessctl interface:

const _ctlGet = () => parseInt('' + spawnSync('./external-bin/brightnessctl', ['get'], { cwd: __dirname }).stdout);
const _ctlMax = () => parseInt('' + spawnSync('./external-bin/brightnessctl', ['max'], { cwd: __dirname }).stdout);

const ctlGet = () => brightnessCurveInv(_ctlGet() / state.max);
const ctlSet = (/**@type {number}*/value, mode = 'add') => {
  if (mode == 'add') value += state.brightness;
  if (Number.isNaN(value)) value = 0.5;
  value = Math.max(0, Math.min(1, value));
  state.brightness = value;
  writeFileSync(`${__dirname}/.state.json`, JSON.stringify(state));
  const brightness = Math.round(brightnessCurve(value) * state.max);
  spawnSync('./external-bin/brightnessctl', ['set', `${brightness}`], { cwd: __dirname });
  return value;
}

const xsfSet = (/**@type {number}*/value, mode = 'add') => {
  if (mode == 'add') value += state.brightness2;
  if (Number.isNaN(value)) value = 0.5;
  value = Math.max(0, Math.min(1, value));
  state.brightness2 = value;
  writeFileSync(`${__dirname}/.state.json`, JSON.stringify(state));
  const temperature = linear(value, { y0: 1000, y1: 6500 });
  const brightness = linear(value, { y0: 0.1, y1: 1 });
  // console.log(temperature, brightness)
  spawnSync('./external-bin/xscreenfilter', [`${temperature}`, `${brightness}`], { stdio: 'inherit', cwd: __dirname });
  return value;
};

// State initialization:

Object.assign(config, loadJSON('config.json'));
Object.assign(state, loadJSON('.state.json'));
if (state.max == -1) state.max = _ctlMax();
if (state.brightness == -1) state.brightness = ctlGet();
if (state.brightness2 == -1) state.brightness2 = 1.0;

const oneAtATime = (fn) => {
  let pending = null;
  return (...args) => {
    if (pending) return pending = { args };
    pending = { args };
    while (pending) {
      const _args = pending.args;
      pending = null;
      fn(..._args);
    }
  }
}

module.exports = {
  config,
  state,
  ctlSet,
  xsfSet,
}