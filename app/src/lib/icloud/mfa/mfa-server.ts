import http from 'http';
import {MFAMethod} from './mfa-method.js';
import * as PACKAGE from '../../package.js';
import {iCPSError} from '../../../app/error/error.js';
import {MFA_ERR} from '../../../app/error/error-codes.js';
import {ResourceManager} from '../../resource-manager/resource-manager.js';
import {iCPSEventError, iCPSEventMFA} from '../../resource-manager/events.js';

/**
 * The MFA timeout value in milliseconds
 */
export const MFA_TIMEOUT_VALUE = 1000 * 60 * 10; // 10 minutes

/**
 * Endpoint URI of MFA Server, all expect POST requests
 */
export const MFA_SERVER_ENDPOINTS = {
    CODE_INPUT: `/mfa`, // Expecting URL parameter 'code' with 6 digits
    RESEND_CODE: `/resend_mfa`, // Expecting URL parameter 'method' (either 'device', 'sms', 'voice') and optionally 'phoneNumberId' (any number > 0)
};

/**
 * This objects starts a server, that will listen to incoming MFA codes and other MFA related commands
 * todo - Implement re-request of MFA code
 */
export class MFAServer {
    /**
     * The server object
     */
    server: http.Server;

    /**
     * Holds the MFA method used for this server
     */
    mfaMethod: MFAMethod;

    /**
     * Timer object to track timeout of MFA request
     */
    mfaTimeout: NodeJS.Timeout;

    /**
     * Creates the server object
     */
    constructor() {
        ResourceManager.logger(this).debug(`Preparing MFA server on port ${ResourceManager.mfaServerPort}`);
        this.server = http.createServer(this.handleRequest.bind(this));
        this.server.on(`error`, err => {
            const icpsErr = (Object.hasOwn(err, `code`) && (err as any).code === `EADDRINUSE`)
                ? new iCPSError(MFA_ERR.ADDR_IN_USE_ERR).addContext(`port`, ResourceManager.mfaServerPort)
                : new iCPSError(MFA_ERR.SERVER_ERR);

            icpsErr.addCause(err);

            ResourceManager.emit(iCPSEventError.HANDLER_EVENT, icpsErr);
        });

        // Default MFA request always goes to device
        this.mfaMethod = new MFAMethod();
    }

    /**
     * Starts the server and listens for incoming requests to perform MFA actions
     */
    startServer() {
        try {
            this.server.listen(ResourceManager.mfaServerPort, () => {
                /* c8 ignore start */
                // Never starting the server just to see logger message
                ResourceManager.emit(iCPSEventMFA.STARTED, ResourceManager.mfaServerPort);
                ResourceManager.logger(this).info(`Exposing endpoints: ${JSON.stringify(Object.values(MFA_SERVER_ENDPOINTS))}`);
                /* c8 ignore stop */
            });

            // MFA code needs to be provided within timeout period
            this.mfaTimeout = setTimeout(() => {
                ResourceManager.emit(iCPSEventMFA.MFA_NOT_PROVIDED, this.mfaMethod, new iCPSError(MFA_ERR.SERVER_TIMEOUT));
                this.stopServer();
            }, MFA_TIMEOUT_VALUE);
        } catch (err) {
            ResourceManager.emit(iCPSEventMFA.ERROR, new iCPSError(MFA_ERR.STARTUP_FAILED).addCause(err));
        }
    }

    /**
     * Handles incoming http requests
     * @param req - The HTTP request object
     * @param res - The HTTP response object
     */
    handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        if (req.method === `GET` && req.url === `/`) {
            this.sendResponse(res, 200, `MFA Server up & running - ${PACKAGE.NAME}@v${PACKAGE.VERSION}`);
            return;
        }

        if (req.method !== `POST`) {
            ResourceManager.emit(iCPSEventError.HANDLER_EVENT, new iCPSError(MFA_ERR.METHOD_NOT_FOUND)
                .setWarning()
                .addMessage(`endpoint ${req.url}, method ${req.method}`)
                .addContext(`request`, req));
            this.sendResponse(res, 400, `Method not supported: ${req.method}`);
            return;
        }

        if (req.url.startsWith(MFA_SERVER_ENDPOINTS.CODE_INPUT)) {
            this.handleMFACode(req, res);
        } else if (req.url.startsWith(MFA_SERVER_ENDPOINTS.RESEND_CODE)) {
            this.handleMFAResend(req, res);
        } else {
            ResourceManager.emit(iCPSEventError.HANDLER_EVENT, new iCPSError(MFA_ERR.ROUTE_NOT_FOUND)
                .addMessage(req.url)
                .setWarning()
                .addContext(`request`, req));
            this.sendResponse(res, 404, `Route not found, available endpoints: ${JSON.stringify(Object.values(MFA_SERVER_ENDPOINTS))}`);
        }
    }

    /**
     * This function will handle requests send to the MFA Code Input Endpoint
     * @param req - The HTTP request object
     * @param res - The HTTP response object
     */
    handleMFACode(req: http.IncomingMessage, res: http.ServerResponse) {
        if (!req.url.match(/\?code=\d{6}$/)) {
            ResourceManager.emit(iCPSEventError.HANDLER_EVENT, new iCPSError(MFA_ERR.CODE_FORMAT)
                .addMessage(req.url)
                .setWarning()
                .addContext(`request`, req));
            this.sendResponse(res, 400, `Unexpected MFA code format! Expecting 6 digits`);
            return;
        }

        const mfa: string = req.url.slice(-6);

        ResourceManager.logger(this).debug(`Received MFA: ${mfa}`);
        this.sendResponse(res, 200, `Read MFA code: ${mfa}`);
        ResourceManager.emit(iCPSEventMFA.MFA_RECEIVED, this.mfaMethod, mfa);
    }

    /**
     * This function will handle the request send to the MFA Code Resend Endpoint
     * @param req - The HTTP request object
     * @param res - The HTTP response object
     */
    handleMFAResend(req: http.IncomingMessage, res: http.ServerResponse) {
        const methodMatch = req.url.match(/method=(?:sms|voice|device)/);
        if (!methodMatch) {
            this.sendResponse(res, 400, `Resend method does not match expected format`);
            ResourceManager.emit(iCPSEventError.HANDLER_EVENT, new iCPSError(MFA_ERR.RESEND_METHOD_FORMAT)
                .addContext(`requestURL`, req.url));
            return;
        }

        const methodString = methodMatch[0].slice(7);

        const phoneNumberIdMatch = req.url.match(/phoneNumberId=\d+/);

        if (phoneNumberIdMatch && methodString !== `device`) {
            this.mfaMethod.update(methodString, parseInt(phoneNumberIdMatch[0].slice(14), 10));
        } else {
            this.mfaMethod.update(methodString);
        }

        this.sendResponse(res, 200, `Requesting MFA resend with method ${this.mfaMethod}`);
        ResourceManager.emit(iCPSEventMFA.MFA_RESEND, this.mfaMethod);
    }

    /**
     * This function will send a response, based on its input variables
     * @param res - The response object, to send the response to
     * @param code - The status code for the response
     * @param msg - The message included in the response
     */
    sendResponse(res: http.ServerResponse, code: number, msg: string) {
        res.writeHead(code, {"Content-Type": `application/json`});
        res.end(JSON.stringify({message: msg}));
    }

    /**
     * Stops the server
     */
    stopServer() {
        ResourceManager.logger(this).debug(`Stopping server`);
        if (this.server) {
            this.server.close();
            this.server = undefined;
        }

        if (this.mfaTimeout) {
            clearTimeout(this.mfaTimeout);
            this.mfaTimeout = undefined;
        }
    }
}