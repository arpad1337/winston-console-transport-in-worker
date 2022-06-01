const ConsoleTransportInWorker = require("../build/dist").ConsoleTransportInWorker;

const { transports: { Console } } = require('winston');

const { LEVEL, MESSAGE } = require('triple-beam');

const prettyBytes = require('./util');

const workerTransport = new ConsoleTransportInWorker();

const consoleTransport = new Console();

const MAX_PAYLOAD_SIZE = (!!process.env.CI) ? 1_500_000 : 500_000_000;

(async () => {
    console.log('Preparing to launch with max message size ' + prettyBytes(MAX_PAYLOAD_SIZE));

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

        console.log('Current message size: ' + prettyBytes(largePayload.length));

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

        results.push([
            largePayload.length, 
            ((ellapsed_1 < ellapsed_2 && ellapsed_1 === 0)
            ? 
            (- ellapsed_2 + 'ms') 
            : 
            ((ellapsed_2 && Math.round(ellapsed_2 / (ellapsed_1 || ellapsed_2))) || 1) + 'x'),
            ellapsed_1, 
            ellapsed_2,
        ]);

        currentSize = Math.floor(currentSize / 5);
    }

    await new Promise(resolve => setTimeout(() => resolve(), ((!!process.env.CI) ? 30 : 60 ) * 1_000)); // waiting for the output finished

    results = results.reverse();
    results.shift();

    const ratios = results
        .filter(r => /([0-9]x)/.test(r[1]))
        .map(r => Number(r[1].split('x')[0]));

    console.log('Simple test with strings of ' + new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(
            results.map((r) => r[0]).map(l => prettyBytes(l))
        ) + ' sizes');
    console.log('Worker transport compared to Console, max speedup when running in background: ' + ((ratios.length > 0 && Math.max(
        ...ratios
    ) + 'x') || '1x') );
    console.log('');
    console.log('');
    console.table(results.map(r => {
        return {
            Size: prettyBytes(r[0]),
            Ratio: r[1],
            "Worker Ellapsed": r[2] + 'ms',
            "Console Ellapsed": r[3] + 'ms',
        };
    }));
    process.exit(0);

})();