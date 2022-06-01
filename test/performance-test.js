const ConsoleTransportInWorker = require("../build/dist").ConsoleTransportInWorker;

const { transports: { Console } } = require('winston');

const { LEVEL, MESSAGE } = require('triple-beam');

const prettyBytes = require('./util');

const workerTransport = new ConsoleTransportInWorker();

const consoleTransport = new Console();

const MAX_PAYLOAD_SIZE = (!!process.env.CI) ? 1_500_000 : 500_000_000;

(async () => {
    console.log('Preparing to launch with max payload size ' + prettyBytes(MAX_PAYLOAD_SIZE));

    await new Promise(resolve => setTimeout(() => resolve(), 1_000)); // waiting for the Worker Thread to launch

    let results = [];

    let currentSize = MAX_PAYLOAD_SIZE;

    while(currentSize > 0) {

        let largePayload = "";
        let cursor = 0;
        while(largePayload.length < currentSize || cursor < currentSize) {
            largePayload += "A".repeat(10);
            cursor += 10;
        }

        console.log('Large payload length: ' + largePayload.length);

        let start = Date.now();

        workerTransport.log({
            [LEVEL]: 'info',
            [MESSAGE]: largePayload,
            level: 'info',
            message: largePayload,
            timestamp: new Date().toISOString(),
        }, () => {

        });

        const ellapsed_1 = Date.now() - start;

        start = Date.now();

        consoleTransport.log({
            [LEVEL]: 'info',
            [MESSAGE]: largePayload,
            level: 'info',
            message: largePayload,
            timestamp: new Date().toISOString(),
        }, () => {

        });

        const ellapsed_2 = Date.now() - start;

        results.push([largePayload.length, (ellapsed_2 && Math.round(ellapsed_2 / (ellapsed_1 || ellapsed_2))) || 1, ellapsed_1, ellapsed_2]);

        currentSize = Math.floor(currentSize / 5);
    }

    await new Promise(resolve => setTimeout(() => resolve(), ((!!process.env.CI) ? 30 : 60 ) * 1_000)); // waiting for the output finished

    results = results.reverse();
    results.shift();

    console.log('Simple test with strings of ' +  results.map((r) => r[0]).map(l => prettyBytes(l)).join(', ') + ' lengths');
    console.log('Worker transport compared to Console, max speedup when running in background: ' + Math.max(...results.map(r => r[1])) + 'x');
    console.log('');
    console.log('');
    console.table(results.map(r => {
        return {
            Size: prettyBytes(r[0]),
            Ratio: r[1] + 'x',
            "Worker Ellapsed": r[2] + 'ms',
            "Console Ellapsed": r[3] + 'ms',
        };
    }));
    process.exit(0);

})();