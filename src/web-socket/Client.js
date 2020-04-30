const { promisify } = require('util');
const EventEmitter = require('events');
const ws = require('ws');

class Client {
  /**
   * @param options {object}
   * @param [options.protocol='ws'] {string}
   * @param options.host {string}
   * @param options.port {number}
   * @param [options.reconnectCount=Infinity] - Reconnect times
   * @param [options.reconnectInterval=5000] - Reconnect interval in ms
   * @param callback
   */
  constructor({
    reconnectCount = Infinity,
    reconnectInterval = 5 * 1000,
    ...options
  }, callback) {

    this.reconnectCount = reconnectCount;
    this.reconnectInterval = reconnectInterval;
    this.options = options;
    this.callback = callback;

    this.eventEmitter = new EventEmitter();
    this.closed = false;
    this.webSocket = null;
    this._reconnectHandle = null;
    this._retryCount = this.reconnectCount;
    this._lastError = null;
    this._connect();
  }

  _connect() {
    // console.log('CLIENT.connect', this._retryCount);

    const { protocol = 'ws', host, port, protocols, ...options } = this.options;

    const webSocket = new ws(`${protocol}://${host}:${port}`, protocols, options);
    webSocket.send = promisify(webSocket.send);
    webSocket.on('message', this.onMessage.bind(this));
    webSocket.on('error', (e) => {
      this._lastError = e;
    });
    webSocket.once('open', () => {
      this._retryCount = this.reconnectCount;
      this._lastError = null;
      this.eventEmitter.emit('open');
    });
    webSocket.once('close', () => {
      if (this.closed) {
        return;
      }

      if (!this._retryCount) {
        throw new Error(`connect failed after retry ${this.reconnectCount} times with error "${this._lastError.message}"`);
      }

      this._reconnectHandle = setTimeout(this._connect.bind(this), this.reconnectInterval);
      this._retryCount -= 1;
    });

    this.webSocket = webSocket;
  }

  async opened() {
    if (this.closed) {
      throw new Error('client is closed');
    }

    switch (this.webSocket.readyState) {
      case ws.CLOSING:
      case ws.CLOSED:
      case ws.CONNECTING:
        await new Promise(resolve => this.eventEmitter.once('open', resolve));
        break;

      case ws.OPEN:
      default:
        break;
    }
  }

  async close(code, data) {
    if (this.closed) {
      return;
    }

    this.closed = true;
    clearTimeout(this._reconnectHandle);
    switch (this.webSocket.readyState) {
      case ws.CONNECTING:
        await this.opened();
        this.webSocket.close(code, data);
        await new Promise(resolve => this.webSocket.once('close', resolve));
        break;

      case ws.OPEN:
        this.webSocket.close(code, data);
        await new Promise(resolve => this.webSocket.once('close', resolve));
        break;

      case ws.CLOSING:
        await new Promise(resolve => this.webSocket.once('close', resolve));
        break;

      case ws.CLOSED:
      default:
        break;
    }
  }

  async send(buffer, options) {
    await this.opened();
    // console.log('CLIENT->', buffer.toString('hex'));
    return this.webSocket.send(buffer, options);
  }

  onMessage(buffer) {
    // console.log('CLIENT<-', buffer.toString('hex'));
    return this.callback(buffer);
  }
}

module.exports = Client;
