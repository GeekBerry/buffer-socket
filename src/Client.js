const EventEmitter = require('events');
const WebSocketClient = require('./web-socket/Client');
const Stream = require('./Stream');
const util = require('./util');

class Client {
  /*
   * @param options {object}
   * @param [options.protocol='ws'] {string}
   * @param options.host {string}
   * @param options.port {number}
   * @param [options.reconnectCount=12] - Reconnect times
   * @param [options.reconnectInterval=5000] - Reconnect interval in ms
   * @param [options.responseTimeout=5*6000] - wait response timeout in ms
   */
  constructor({
    responseTimeout = 5 * 60 * 1000,
    ...options
  } = {}) {
    this.webSocketClient = new WebSocketClient(options, this.onMessage.bind(this));

    this.responseTimeout = responseTimeout;
    this.requestEvent = new EventEmitter();
  }

  onMessage(buffer) {
    const stream = new Stream(buffer);
    const requestId = stream.readInt();
    this.requestEvent.emit(requestId, stream);
  }

  async _doRequest(buffer, options = {}) {
    const requestId = util.randomInt32();
    const output = new Stream();
    output.writeInt(requestId);
    output.write(buffer);
    await this.webSocketClient.send(output.toBuffer(), options);

    return requestId;
  }

  _onResponse(requestId, timeout) {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(
        () => {
          this.requestEvent.removeAllListeners(requestId);

          const timeoutError = new Error(`request:${util.intToBuffer(requestId).toString('hex')} timeout after ${timeout} ms`);
          reject(timeoutError);
        },
        timeout,
      );

      this.requestEvent.once(requestId, input => {
        clearTimeout(timeoutHandle);

        const code = input.readInt();
        if (code === util.SUCCESS) {
          resolve(input);
        } else {
          reject(new Error(`${input.toBuffer()}`));
        }
      });
    });
  }

  async request(buffer, options) {
    const requestId = await this._doRequest(buffer, options);
    return this._onResponse(requestId, this.responseTimeout);
  }

  close() {
    return this.webSocketClient.close();
  }
}

module.exports = Client;
