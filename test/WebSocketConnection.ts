import ava from 'ava';
import * as WebSocket from 'ws';
import { WebSocketConnection, ReadyDispatch, HelloPayload, WebSocketEvents, OpCodes, HeartbeatAck, WSWorkerData, InternalActions } from '../src';
import { EventEmitter } from 'events';

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
	port: 8082,
	perMessageDeflate: {
		zlibDeflateOptions: {
			// See zlib defaults.
			chunkSize: 128 * 1024
		},
		zlibInflateOptions: {
			chunkSize: 128 * 1024
		},
		// Below options specified as default values.
		// Limits zlib concurrency for perf.
		concurrencyLimit: 10,
		// Size (in bytes) below which messages
		// should not be compressed.
		threshold: 0
	}
})
	.on('connection', (ws) => {
		ws.on('message', (message): void => {
			const data = JSON.parse(message as string);

			switch (data.op) {
				case OpCodes.IDENTIFY: {
					return ws.send(Buffer.from(JSON.stringify(ready)));
				}
				case OpCodes.HELLO: {
					return ws.send(Buffer.from(JSON.stringify(hello)));
				}
				case OpCodes.HEARTBEAT: {
					return ws.send(Buffer.from(JSON.stringify(heartbeatAck)));
				}
				default: {
					throw data;
				}
			}
		});
		ws.send(Buffer.from(JSON.stringify(hello)));
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
				test.pass();
				// test.end();
			}
		});

	// @ts-expect-error
	// eslint-disable-next-line no-new
	new WebSocketConnection(port, workerData);
});
