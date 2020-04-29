const crypto = require('crypto');

function randomInt32() {
  return crypto.randomBytes(4).readInt32LE();
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

module.exports = {
  CODE: {
    SUCCESS: 0,
    ERROR: 1,
  },

  randomInt32,
  intToBuffer,
  numberToBuffer,
};
