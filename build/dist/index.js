"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleTransportInWorker = void 0;
const winston = require("winston");
const triple_beam_1 = require("triple-beam");
const worker_threads_1 = require("worker_threads");
class ConsoleTransportInWorker extends winston.transports.Console {
    constructor(opts) {
        super(opts);
        if (worker_threads_1.isMainThread) {
            this.nestedWorker = new worker_threads_1.Worker(__filename, { workerData: opts });
            this.nestedWorker.setMaxListeners(100);
        }
        else {
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (info) => {
                const receivable = this.decodeFromTransport(info);
                this.log(receivable, () => worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage('next'));
            });
        }
    }
    log(info, next) {
        if (!worker_threads_1.isMainThread) {
            super.log(info, next);
        }
        else {
            this.nestedWorker.once('message', (message) => {
                if (message === 'next') {
                    next();
                }
            });
            const transportable = this.encodeForTransport(info);
            this.nestedWorker.postMessage(transportable);
        }
    }
    encodeForTransport(info) {
        const newPointer = info;
        newPointer.SymbolLevel = info[triple_beam_1.LEVEL];
        newPointer.SymbolMessage = info[triple_beam_1.MESSAGE];
        delete newPointer[triple_beam_1.LEVEL];
        delete newPointer[triple_beam_1.MESSAGE];
        return newPointer;
    }
    decodeFromTransport(info) {
        const newPointer = info;
        newPointer[triple_beam_1.LEVEL] = info.SymbolLevel;
        newPointer[triple_beam_1.MESSAGE] = info.SymbolMessage;
        delete newPointer.SymbolLevel;
        delete newPointer.SymbolMessage;
        return newPointer;
    }
}
exports.ConsoleTransportInWorker = ConsoleTransportInWorker;
if (!worker_threads_1.isMainThread) {
    new ConsoleTransportInWorker(worker_threads_1.workerData);
}
//# sourceMappingURL=index.js.map