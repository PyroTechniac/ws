import ava from 'ava';
import * as WebSocket from 'ws';
import { WebSocketConnection, ReadyDispatch, HelloPayload, WebSocketEvents, OpCodes, HeartbeatAck, WSWorkerData, InternalActions } from '../src';
import { EventEmitter } from 'events';
import { Deflate } from 'pako';
import { Z_SYNC_FLUSH } from 'zlib';

/* eslint-disable @typescript-eslint/camelcase, id-length */

// @ts-expect-error
const hello: HelloPayload = {
	op: OpCodes.HELLO,
	d: {
		heartbeat_interval: 30000
	}
};

const ready: ReadyDispatch = {
	v: 1,
	t: WebSocketEvents.Ready,
	// @ts-expect-error
	d: {
		user_settings: {},
		user: {
			username: 'foo',
			id: '1234526',
			discriminator: '0000',
			avatar: null
		},
		guilds: [],
		session_id: 'abc1234'
	}
};

// @ts-expect-error
const heartbeatAck: HeartbeatAck = {
	op: OpCodes.HEARTBEAT_ACK
};

const workerData: WSWorkerData = {
	gatewayURL: 'http://localhost:8082/',
	gatewayVersion: 7,
	token: 'Not-A-Real-Token',
	options: {
		shards: 1,
		totalShards: 1,
		shard: [0, 1],
		intents: 1,
		additionalOptions: {},
		gatewayVersion: 7
	}
};


new WebSocket.Server({
	port: 8082
})
	.on('connection', (ws) => {
		const deflate = new Deflate();

		ws.on('message', (message): void => {
			const data = JSON.parse(message as string);

			switch (data.op) {
				case OpCodes.IDENTIFY: {
					deflate.push(Buffer.from(JSON.stringify(ready)), Z_SYNC_FLUSH);
					break;
				}
				case OpCodes.HELLO: {
					deflate.push(Buffer.from(JSON.stringify(ready)), Z_SYNC_FLUSH);
					break;
				}
				case OpCodes.HEARTBEAT: {
					deflate.push(Buffer.from(JSON.stringify(ready)), Z_SYNC_FLUSH);
					break;
				}
				default: {
					throw data;
				}
			}
			ws.send(deflate.result);
		});

		deflate.push(Buffer.from(JSON.stringify(hello)), Z_SYNC_FLUSH);
		ws.send(deflate.result);
	});

class MessagePortLike extends EventEmitter {

	public postMessage(data: any): void {
		this.emit('message', data);
	}

}

ava.cb(InternalActions.Debug, (test): void => {
	const port = new MessagePortLike()
		.on('message', (data) => {
			if (data.type === InternalActions.Debug) {
				port.removeAllListeners();
				test.pass();
				test.end();
			}
		});

	// @ts-expect-error
	// eslint-disable-next-line no-new
	new WebSocketConnection(port, workerData);
});

ava.cb(InternalActions.ConnectionStatusUpdate, (test): void => {
	const port = new MessagePortLike()
		.on('message', (data) => {
			if (data.type === InternalActions.ConnectionStatusUpdate) {
				port.removeAllListeners();
				test.pass();
				test.end();
			}
		});

	// @ts-expect-error
	// eslint-disable-next-line no-new
	new WebSocketConnection(port, workerData);
});

ava.skip(InternalActions.Dispatch, (test): void => {
	const port = new MessagePortLike()
		.on('message', (data) => {
			if (data.type === InternalActions.Dispatch) {
				port.removeAllListeners();
				test.pass();
				// test.end();
			}
		});

	// @ts-expect-error
	// eslint-disable-next-line no-new
	new WebSocketConnection(port, workerData);
});
