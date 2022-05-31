import * as winston from 'winston';

import { LEVEL, MESSAGE } from 'triple-beam';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

import { ConsoleTransportOptions } from 'winston/lib/winston/transports';

interface IConsoleInWorkerTransportableBase {
    message: string;
    level: string;
    timestamp: string;
}

interface IConsoleInWorkerTransportable extends IConsoleInWorkerTransportableBase {
    SymbolLevel: string;
    SymbolMessage: string;
}

interface IConsoleInWorkerReceivable extends IConsoleInWorkerTransportableBase {
    [LEVEL]: string;
    [MESSAGE]: string;
}

export class ConsoleTransportInWorker extends winston.transports.Console {
    
    private nestedWorker: Worker;

    constructor(opts?: ConsoleTransportOptions) {
        super(opts);
        if (isMainThread) {
            this.nestedWorker = new Worker(__filename, {workerData: opts});
            this.nestedWorker.setMaxListeners(100);
        } else {
            parentPort?.on('message', (info: IConsoleInWorkerTransportable): void => {
                const receivable: IConsoleInWorkerReceivable = this.decodeFromTransport(info);
                this.log(receivable, () => parentPort?.postMessage('next'));
            });
        }
    }

    public log(info: IConsoleInWorkerReceivable, next: () => void): any {
        if (!isMainThread) {
            super.log!(info, next);
        } else {
            this.nestedWorker.once('message', (message: string): void => {
                if (message === 'next') {
                    next();
                }
            });
            const transportable: IConsoleInWorkerTransportable = this.encodeForTransport(info);
            this.nestedWorker.postMessage(transportable);
        }
    }

    private encodeForTransport(info: IConsoleInWorkerReceivable): IConsoleInWorkerTransportable {
        const { message, level, timestamp } = info;
        return {
            SymbolLevel: info[LEVEL],
            SymbolMessage: info[MESSAGE],
            level,
            message,
            timestamp,
        };
    }

    private decodeFromTransport(info: IConsoleInWorkerTransportable): IConsoleInWorkerReceivable {
        const { message, level, timestamp } = info;
        return {
            [LEVEL]: info.SymbolLevel,
            [MESSAGE]: info.SymbolMessage,
            level,
            message,
            timestamp,
        };
    }
    
}

if(!isMainThread) {
    new ConsoleTransportInWorker(workerData);
}
