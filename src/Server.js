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
  constructor(options, middleware) {
    super(options);

    this.on('connection', (...args) => this.onConnection(...args));
    this.on('error', (...args) => this.onError(...args));
    this.middleware = middleware;
  }

  onConnection(webSocket) {
    // webSocket.on('ping', () => {
    //   TODO
    // });
    //
    // webSocket.on('pong', () => {
    //   TODO
    // });
    //
    // webSocket.on('close', () => {
    //   TODO
    // });

    webSocket.on('message', async (input) => {
      // console.log('->', input);
      const output = await this.onSocketMessage(input);
      // console.log('<-', output);
      await webSocket.send(output);
    });
  }

  onError(error) {
    throw error;
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
      await this.middleware(inputStream, outputStream);
      return outputStream.toBuffer();
    } catch (e) {
      errorStream.write(Buffer.from(e.message));
      return errorStream.toBuffer();
    }
  }
}

module.exports = Server;
