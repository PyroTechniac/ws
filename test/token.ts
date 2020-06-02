import ava from 'ava';
import { REST } from '@klasa/rest';
import { WebSocketManager } from '../src';

const ws = new WebSocketManager(new REST());

ava('You need a token to connect', async (test): Promise<void> => {
	await test.throwsAsync(ws.spawn(), { instanceOf: Error });
});
