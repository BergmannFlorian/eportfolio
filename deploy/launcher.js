// Self-reloading launcher for the Infomaniak Node.js hosting.
//
// Infomaniak starts the site with `node index.js` and offers no public API to
// restart it. This file is deployed as that index.js: it runs the SvelteKit
// server (adapter-node output in ./app) as a child process and restarts it
// when the deploy workflow writes the `.deploy-version` marker, i.e. once all
// new files are uploaded. It also restarts the server if it exits on its own.
//
// No dependencies: runs on plain Node.js.

import { spawn } from 'node:child_process';
import { existsSync, watchFile } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const entry = join(root, 'app', 'index.js');
const marker = join(root, '.deploy-version');

const POLL_INTERVAL_MS = 2_000;
const STOP_TIMEOUT_MS = 10_000;
const MIN_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

let child = null;
let restarting = false;
let shuttingDown = false;
let backoff = MIN_BACKOFF_MS;
let retryTimer = null;

const log = (message) => console.log(`[launcher] ${new Date().toISOString()} ${message}`);

function start() {
	retryTimer = null;
	if (shuttingDown || child) return;
	if (!existsSync(entry)) {
		// Files are missing, e.g. while the deploy is uploading them
		scheduleRetry(`${entry} not found`);
		return;
	}

	const startedAt = Date.now();
	child = spawn(process.execPath, [entry], { cwd: root, env: process.env, stdio: 'inherit' });
	log(`server started (pid ${child.pid})`);

	child.on('exit', (code, signal) => {
		child = null;
		if (shuttingDown || restarting) return;
		// A server that ran for a while resets the backoff
		if (Date.now() - startedAt > MAX_BACKOFF_MS) backoff = MIN_BACKOFF_MS;
		scheduleRetry(`server exited (code ${code}, signal ${signal})`);
	});
}

function scheduleRetry(reason) {
	if (shuttingDown || retryTimer) return;
	log(`${reason}, retrying in ${backoff / 1000}s`);
	retryTimer = setTimeout(start, backoff);
	backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
}

/** Stops the running server gracefully (adapter-node handles SIGTERM), then force-kills it. */
function stop() {
	if (!child) return Promise.resolve();
	const current = child;
	return new Promise((resolve) => {
		const killTimer = setTimeout(() => current.kill('SIGKILL'), STOP_TIMEOUT_MS);
		current.once('exit', () => {
			clearTimeout(killTimer);
			resolve();
		});
		current.kill('SIGTERM');
	});
}

async function restart(reason) {
	if (restarting || shuttingDown) return;
	restarting = true;
	log(`restarting: ${reason}`);
	if (retryTimer) {
		clearTimeout(retryTimer);
		retryTimer = null;
	}
	await stop();
	child = null;
	backoff = MIN_BACKOFF_MS;
	restarting = false;
	start();
}

async function shutdown(signal) {
	if (shuttingDown) return;
	shuttingDown = true;
	log(`received ${signal}, stopping`);
	if (retryTimer) clearTimeout(retryTimer);
	await stop();
	process.exit(0);
}

// Polling survives the marker being deleted and recreated by a deploy
watchFile(marker, { interval: POLL_INTERVAL_MS }, (current, previous) => {
	if (current.mtimeMs !== 0 && current.mtimeMs !== previous.mtimeMs) {
		restart('new deploy detected');
	}
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
