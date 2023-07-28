import * as fs from 'fs';
import {ResourceManager} from "../../lib/resource-manager/resource-manager.js";
import {iCPSEventError, iCPSEventLog} from "../../lib/resource-manager/events.js";
import {iCPSError} from "../error/error.js";
import {APP_ERR} from "../error/error-codes.js";
import {FILE_ENCODING} from '../../lib/resource-manager/resources.js';

/**
 * This class handles the input/output to a log file
 */
export class LogInterface {
    /**
     * The opened file descriptor of the log file
     */
    private logFileDescriptor: number;

    logFilePath: string;

    constructor() {
        if (ResourceManager.logToCli) {
            return;
        }

        ResourceManager.enableLogging();

        try {
            // Try opening the file - truncate if exists
            this.logFileDescriptor = fs.openSync(ResourceManager.logFilePath, `w`);

            switch (ResourceManager.logLevel) {
            case `debug`:
                ResourceManager.on(iCPSEventLog.DEBUG, (instance: any, msg: string) => this.logMessage(`debug`, instance, msg));
            default:
            case `info`:
                ResourceManager.on(iCPSEventLog.INFO, (instance: any, msg: string) => this.logMessage(`info`, instance, msg));
            case `warn`:
                ResourceManager.on(iCPSEventLog.WARN, (instance: any, msg: string) => this.logMessage(`warn`, instance, msg));
            case `error`:
                ResourceManager.on(iCPSEventLog.ERROR, (instance: any, msg: string) => this.logMessage(`error`, instance, msg));
            }
        } catch (err) {
            ResourceManager.emit(iCPSEventError.HANDLER_EVENT, new iCPSError(APP_ERR.LOGGER).setWarning().addCause(err));
        }
    }

    private logMessage(level: string, instance: any, msg: string) {
        if (level === `warn` && msg === undefined) {
            console.log();
        }

        const prefixedMessage = `[${new Date().toISOString()}] ${level.toUpperCase()} ${String(instance.constructor.name)}: ${msg}\n`;
        fs.appendFileSync(this.logFileDescriptor, prefixedMessage, {encoding: FILE_ENCODING});
    }
}