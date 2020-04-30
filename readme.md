# Buffer socket

Buffer input output framework base on websocket. 

## Usage

* server

```
const { Server, Client } = require('@geekberry/buffer-socket');

const server = new Server(
  { host: '127.0.0.1', port: 6080, checkAliveInterval:30*1000 }, 
  (input, output) =>{
    output.write(input.toBuffer().reverse());
  }
);
```

* client

```
const client = new Client({ host: '127.0.0.1', port: 6080 });

const stream = await client.request(Buffer.from('1234'));

console.log(stream.toBuffer().toString()); // 4321
```

## Package structure:

* request:

length  | note
--------|------------
4 bytes | requestId
N bytes | data

* response:

length  | note
--------|------------
4 bytes | requestId
4 bytes | SUCCESS
N bytes | data

* error:

length  | note
--------|------------
4 bytes | requestId
4 bytes | ERROR
N bytes | error message
