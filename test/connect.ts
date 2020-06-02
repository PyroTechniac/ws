import ava from 'ava';
import nock = require('nock');
import { REST, Routes, RestOptionsDefaults } from '@klasa/rest';
import * as WebSocket from 'ws';
import { WebSocketManager, ReadyDispatch, HelloPayload, WebSocketEvents, OpCodes, HeartbeatAck } from '../src';
import type { APIGatewayBotData } from '@klasa/dapi-types';

/* eslint-disable @typescript-eslint/camelcase, id-length */

const gatewayInfo: APIGatewayBotData = {
	url: 'http://localhost:8080/',
	shards: 1,
	session_start_limit: {
		total: 1,
		remaining: 1,
		reset_after: 1
	}
};

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

new WebSocket.Server({
	port: 8080,
	perMessageDeflate: {
		zlibDeflateOptions: {
			// See zlib defaults.
			chunkSize: 1024,
			memLevel: 7,
			level: 3
		},
		zlibInflateOptions: {
			chunkSize: 10 * 1024
		},
		// Other options settable:
		clientNoContextTakeover: true, // Defaults to negotiated value.
		serverNoContextTakeover: true, // Defaults to negotiated value.
		serverMaxWindowBits: 10, // Defaults to negotiated value.
		// Below options specified as default values.
		concurrencyLimit: 10, // Limits zlib concurrency for perf.
		threshold: 1024 // Size (in bytes) below which messages
		// should not be compressed.
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

nock(`${RestOptionsDefaults.api}/v${RestOptionsDefaults.version}`)
	.get(Routes.gatewayBot())
	.times(Infinity)
	.reply(204, gatewayInfo);

const rest = new REST();
const ws = new WebSocketManager(rest);

ws.token = rest.token = 'Not-A-Real-Token';

ava('Connect to the ws', async (test): Promise<void> => {
	await ws.spawn();
	test.pass();
});
