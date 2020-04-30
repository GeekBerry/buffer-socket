const { promisify } = require('util');
const ws = require('ws');

class Server extends ws.Server {
  /**
   * @param options {object}
   * @param [options.checkAliveInterval=30*1000] {number} - Check alive interval in ms
   * @param callback {function}
   */
  constructor({
    checkAliveInterval = 30 * 1000,
    ...rest
  }, callback) {
    super(rest);
    this.callback = callback;

    this.close = promisify(this.close);
    this.on('connection', this.onConnection.bind(this));
    this.on('error', this.onError.bind(this));
    this.on('close', this.onClose.bind(this));

    this.checkAliveHandle = setInterval(this.checkAlive.bind(this), checkAliveInterval);
  }

  checkAlive() {
    for (const client of this.clients) {
      if (!client.isAlive) {
        client.terminate();
      } else {
        client.isAlive = false;
        client.ping();
      }
    }
  }

  async onConnection(webSocket) {
    webSocket.isAlive = true;

    // webSocket.on('error', (e) => console.error('SERVER.onError', e)); // TODO
    // webSocket.on('close', () => console.log('SERVER.onClose')); // TODO
    // webSocket.on('ping', () => console.log('SERVER.onPing')); // TODO

    webSocket.on('pong', () => {
      // console.log('SERVER.onPong');
      webSocket.isAlive = true;
    });

    webSocket.on('message', async (input) => {
      // console.log('SERVER<-', input.toString('hex'));
      const output = await this.callback(input);
      // console.log('SERVER->', output.toString('hex'));
      await webSocket.send(output);
    });
  }

  onError(error) {
    // console.log('SERVER.onError', error);
    throw error;
  }

  onClose() {
    // console.log('SERVER.onClose');
    clearInterval(this.checkAliveHandle);
  }
}

module.exports = Server;
