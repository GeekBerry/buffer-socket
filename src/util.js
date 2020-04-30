const crypto = require('crypto');

function randomInt32() {
  return crypto.randomBytes(4).readInt32LE();
}

// ----------------------------------------------------------------------------
function boolToBuffer(value) {
  return value ? Buffer.from([1]) : Buffer.from([0]);
}

function intToBuffer(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32LE(value, 0);
  return buffer;
}

function numberToBuffer(value) {
  const buffer = Buffer.alloc(8);
  buffer.writeDoubleLE(value, 0);
  return buffer;
}

// ----------------------------------------------------------------------------
function bufferToBool(buffer) {
  return Boolean(buffer[0]);
}

function bufferToInt(buffer) {
  return buffer.readInt32LE(0);
}

function bufferToNumber(buffer) {
  return buffer.readDoubleLE(0);
}

module.exports = {
  SUCCESS: 0,
  ERROR: 1,

  randomInt32,

  boolToBuffer,
  intToBuffer,
  numberToBuffer,

  bufferToBool,
  bufferToInt,
  bufferToNumber,
};
