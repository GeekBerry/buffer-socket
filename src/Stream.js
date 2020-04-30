const assert = require('assert');
const util = require('./util');

class Stream {
  constructor(buffer) {
    this._array = [];
    this._col = 0;
    this._length = 0;

    if (buffer) {
      this.write(buffer);
    }
  }

  get length() {
    return this._length;
  }

  // ----------------------------------
  /**
   * @param buffer {Stream|Buffer}
   * @return {Stream}
   */
  write(buffer) {
    buffer = buffer instanceof Stream ? buffer.toBuffer() : buffer;

    assert(Buffer.isBuffer(buffer), `value must be Buffer, got "${buffer}"`);

    this._array.push(buffer);
    this._length += buffer.length;
    return this;
  }

  writeBool(value) {
    return this.write(util.boolToBuffer(value));
  }

  writeInt(value) {
    assert(Number.isInteger(value), `value must be integer got "${value}"`);

    return this.write(util.intToBuffer(value));
  }

  writeNumber(value) {
    assert(Number.isFinite(value), `value must be finite got "${value}"`);

    return this.write(util.numberToBuffer(value));
  }

  writeBuffer(buffer) {
    assert(Buffer.isBuffer(buffer), `value must be Buffer, got "${buffer}"`);

    this.writeInt(buffer.length);
    return this.write(buffer);
  }

  // --------------------------------------------------------------------------
  _pick(size) {
    let row = 0;
    let col = this._col;

    const array = [];
    while (row < this._array.length && size > 0) {
      const line = this._array[row];

      const slice = col === 0 && size >= line.length ? line : line.slice(col, col + size);
      size -= slice.length;
      col += slice.length;

      if (col >= line.length) {
        row += 1;
        col = 0;
      }

      array.push(slice);
    }

    const buffer = Buffer.concat(array);
    return { buffer, row, col };
  }

  /**
   * @param size {int}
   * @return {Buffer}
   */
  pick(size) {
    assert(Number.isInteger(size), `size must be integer got "${size}"`);

    const { buffer } = this._pick(size);
    return buffer;
  }

  // --------------------------------------------------------------------------
  /**
   * @param size {int}
   * @return {Buffer}
   */
  read(size) {
    assert(Number.isInteger(size), `size must be integer got "${size}"`);

    const { row, col, buffer } = this._pick(size);
    this._array = this._array.slice(row); // pop this._array
    this._col = col;
    this._length -= buffer.length;

    return buffer;
  }

  readBool() {
    return util.bufferToBool(this.read(1));
  }

  readInt() {
    return util.bufferToInt(this.read(4));
  }

  readNumber() {
    return util.bufferToNumber(this.read(8));
  }

  readBuffer() {
    const size = this.readInt();
    return this.read(size);
  }

  // ----------------------------------
  toBuffer() {
    const array = [...this._array];
    if (this._col && array.length) {
      array[0] = array[0].slice(this._col);
    }
    return Buffer.concat(array);
  }
}

module.exports = Stream;
