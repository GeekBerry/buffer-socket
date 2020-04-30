const { Server, Client } = require('../index');

let server;

beforeAll(() => {
  function reverseBuffer(input, output) {
    if (input.length) {
      output.write(input.toBuffer().reverse());
    } else {
      throw new Error('reverseBuffer not accept empty buffer');
    }
  }

  server = new Server({ host: '127.0.0.1', port: 6080 }, reverseBuffer);
});

test('request', async () => {
  const client = new Client({ host: '127.0.0.1', port: 6080 });

  const stream = await client.request(Buffer.from('1234'));
  expect(stream.toBuffer().toString()).toEqual('4321');

  await expect(client.request(Buffer.from(''))).rejects.toThrow('reverseBuffer not accept empty buffer');

  await client.close();
});

afterAll(() => {
  server.close();
});
