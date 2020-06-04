import ava from 'ava';
import nock = require('nock');
import { REST, Routes, RestOptionsDefaults } from '@klasa/rest';
import * as WebSocket from 'ws';
import { WebSocketManager, ReadyDispatch, HelloPayload, WebSocketEvents, OpCodes, HeartbeatAck } from '../src';
import type { APIGatewayBotData } from '@klasa/dapi-types';
import { Deflate } from 'pako';
import { Z_SYNC_FLUSH } from 'zlib';

/* eslint-disable @typescript-eslint/camelcase, id-length */

const gatewayInfo: APIGatewayBotData = {
	url: 'http://localhost:8080',
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
	port: 8080
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
