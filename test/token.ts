import ava from 'ava';
import { REST } from '@klasa/rest';
import { WebSocketManager } from '../src';

const rest = new REST();

const ws = new WebSocketManager(rest);

ava('You need a token to connect', async (test): Promise<void> => {
	await test.throwsAsync(ws.spawn(), { instanceOf: Error });
});
