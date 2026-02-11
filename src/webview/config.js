// runtime config
let maxHistory = 180;
let refreshRate = 1;
let smoothRate = 1;

// data buffer
let buffer = [];

function safeNum(v) {
  return typeof v === 'number' ? v : null;
}