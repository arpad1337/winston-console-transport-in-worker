const ConsoleTransportInWorker = require("./build/dist").ConsoleTransportInWorker;

const { transports: { Console } } = require('winston');

const { LEVEL, MESSAGE } = require('triple-beam');

const workerTransport = new ConsoleTransportInWorker();

const consoleTransport = new Console();

let largePayload = "A".repeat(1000000); // 10 Mbyte

console.log('Large payload length: ' + largePayload.length);

let start = Date.now();

workerTransport.log({
    [LEVEL]: 'info',
    [MESSAGE]: largePayload,
    level: 'info',
    message: largePayload,
    timestamp: new Date().toISOString(),
}, () => {
    console.log('Worker transport done.');
})

const ellapsed_1 = Date.now() - start;

start = Date.now();

consoleTransport.log({
    [LEVEL]: 'info',
    [MESSAGE]: largePayload,
    level: 'info',
    message: largePayload,
    timestamp: new Date().toISOString(),
}, () => {
    console.log('Console transport done');
})

const ellapsed_2 = Date.now() - start;

(async () => {
    await new Promise(_ => setTimeout(() => {
        console.log('Simple test with: ' + Math.floor(largePayload.length / 1000000) + 'MB');
        console.log('Worker transport resolved in: ' + ellapsed_1 + 'ms');
        console.log('Console transport resolved in: ' + ellapsed_2 + 'ms');
        process.exit(0);
    }, 1000));
})();