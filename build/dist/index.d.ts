import * as winston from 'winston';
import { LEVEL, MESSAGE } from 'triple-beam';
import { ConsoleTransportOptions } from 'winston/lib/winston/transports';
interface IConsoleInWorkerTransportableBase {
    message: string;
    level: string;
    timestamp: string;
}
interface IConsoleInWorkerReceivable extends IConsoleInWorkerTransportableBase {
    [LEVEL]: string;
    [MESSAGE]: string;
}
export declare class ConsoleTransportInWorker extends winston.transports.Console {
    private nestedWorker;
    constructor(opts?: ConsoleTransportOptions);
    log(info: IConsoleInWorkerReceivable, next: () => void): any;
    private encodeForTransport;
    private decodeFromTransport;
}
export {};
