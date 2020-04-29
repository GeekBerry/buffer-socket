const ws = require('ws');
const Stream = require('./Stream');
const { CODE } = require('./util');

/*
- Package structure:

request:
|    4 bytes    |  N bytes ...
    requestId         data

response:
|    4 bytes    |    4 bytes    |    N bytes ...
    requestId      CODE.SUCCESS       data

error:
|    4 bytes    |    4 bytes    |    N bytes ...
    requestId       CODE.ERROR     error message
 */

class Server extends ws.Server {
  /**
   * @param options {object}
   * @param [options.checkAliveInterval] {number} - Check alive interval in ms
   * @param callback {function}
   */
  constructor(options, callback) {
    super(options);
    this.callback = callback;

    this.on('connection', this.onConnection.bind(this));
    this.on('error', this.onError.bind(this));
    this.on('close', this.onClose.bind(this));

    if (options.checkAliveInterval) {
      this.checkAliveHandle = setInterval(this.checkAlive.bind(this), options.checkAliveInterval);
    }
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
      // console.log('SERVER<-', input);
      const output = await this.onSocketMessage(input);
      // console.log('SERVER->', output);
      await webSocket.send(output);
    });
  }

  onError(error) {
    // console.log('SERVER.onError', error);
    throw error;
  }

  onClose() {
    // console.log('SERVER.onClose');

    if (this.checkAliveHandle) {
      clearInterval(this.checkAliveHandle);
    }
  }

  async onSocketMessage(buffer) {
    const inputStream = new Stream(buffer);
    const requestId = inputStream.readInt();

    const outputStream = new Stream();
    outputStream.writeInt(requestId);
    outputStream.writeInt(CODE.SUCCESS);

    const errorStream = new Stream();
    errorStream.writeInt(requestId);
    errorStream.writeInt(CODE.ERROR);

    try {
      await this.callback(inputStream, outputStream);
      return outputStream.toBuffer();
    } catch (e) {
      errorStream.write(Buffer.from(e.message));
      return errorStream.toBuffer();
    }
  }
}

module.exports = Server;
