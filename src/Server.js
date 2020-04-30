const WebSocketServer = require('./web-socket/Server');
const Stream = require('./Stream');
const util = require('./util');

class Server {
  /**
   * @param options {object}
   * @param options.host {string}
   * @param options.port {number}
   * @param [options.checkAliveInterval] {number} - Check alive interval in ms
   * @param middleware {function}
   */
  constructor(options, middleware) {
    this.webSocketServer = new WebSocketServer(options, this.onMessage.bind(this));
    this.middleware = middleware;
  }

  async onMessage(buffer) {
    const inputStream = new Stream(buffer);
    const requestId = inputStream.readInt();

    const outputStream = new Stream();
    outputStream.writeInt(requestId);
    outputStream.writeInt(util.SUCCESS);

    const errorStream = new Stream();
    errorStream.writeInt(requestId);
    errorStream.writeInt(util.ERROR);

    try {
      await this.middleware(inputStream, outputStream);
      return outputStream.toBuffer();
    } catch (e) {
      errorStream.write(Buffer.from(e.message));
      return errorStream.toBuffer();
    }
  }

  close() {
    return this.webSocketServer.close();
  }
}

module.exports = Server;
