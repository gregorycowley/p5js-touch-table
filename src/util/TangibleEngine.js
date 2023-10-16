"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const net = __importStar(require("net"));
/**
 * The payload types used by the Tangible Engine 2 service.
 *
 * @enum {string}
 */
var PAYLOAD_TYPES;
(function (PAYLOAD_TYPES) {
    PAYLOAD_TYPES[PAYLOAD_TYPES["none"] = 0] = "none";
    PAYLOAD_TYPES[PAYLOAD_TYPES["init"] = 1] = "init";
    PAYLOAD_TYPES[PAYLOAD_TYPES["patterns"] = 2] = "patterns";
    PAYLOAD_TYPES[PAYLOAD_TYPES["update"] = 3] = "update";
    PAYLOAD_TYPES[PAYLOAD_TYPES["reset"] = 4] = "reset";
    PAYLOAD_TYPES[PAYLOAD_TYPES["error"] = 5] = "error";
})(PAYLOAD_TYPES || (PAYLOAD_TYPES = {}));
/**
 * The Tangible Engine 2 binding for Node. The Tangible Engine class
 * communicates via TCP with the Tangible Engine Service. It is meant to be
 * used in conjuction with Ideum's Tangible Engine 2 service.
 *
 * @alpha
 */
class TangibleEngine extends events_1.EventEmitter {
    /**
     * Creates an instance of the TangibleEngine client.
     *
     * @param {number} port - The port number of the Tangible Engine service.
     * @param {string} selector - An optional DOMString used to register touch events.
     * Touch events will be attached to the Window by default.
     * @memberof TangibleEngine
     */
    constructor(port = 4948, selector) {
        super();
        this.scaleFunction = (x, y) => { return { x: x, y: y }; };
        this._client = net.connect({ host: '127.0.0.1', port });
        this._client.setKeepAlive(true);
        this.client.on('connect', () => {
            this._isConnected = true;
            this.emit('connect');
        });
        this._client.on('data', data => {
            const response = this.toObjectBufferPayload(data);
            this.emit(PAYLOAD_TYPES[response.TYPE], response);
            // hydrate patterns
            if (response.TYPE === 2) {
                this._patterns = response.PATTERNS;
            }
        });
        this._client.on('end', () => {
            this._isConnected = false;
            this.emit('disconnect');
        });
        this.isWriting = false;
        this._hasWindow = typeof window !== 'undefined';
        if (selector) {
            this._target = document.querySelector(selector);
        }
        else {
            if (this._hasWindow) {
                this._target = window;
            }
        }
    }
    /**
     * The instance's socket client used to make TCP calls to the TE service.
     *
     * @public
     * @readonly
     * @memberof TangibleEngine
     */
    get client() {
        return this._client;
    }
    /**
     * Checks whether or not a browser window is available in the current context.
     * A browser window is required for registering touch event listeners.
     *
     * @readonly
     * @type {boolean}
     * @memberof TangibleEngine
     */
    get hasWindow() {
        return this._hasWindow;
    }
    /**
     * Returns whether or not the client is connected to the server.
     *
     * @readonly
     * @type {boolean}
     * @memberof TangibleEngine
     */
    get isConnected() {
        return this._isConnected;
    }
    /**
     * This property is used to keep track of whether or not the socket is
     * actively writing to the server.
     *
     * @public
     * @memberof TangibleEngine
     */
    get isWriting() {
        return this._isWriting;
    }
    set isWriting(value) {
        this._isWriting = value;
    }
    set scaleFunc(value) {
        this.scaleFunction = value;
    }
    /**
     * A list of patterns registered with the Tangible Engine service. Patterns
     * are returned from the service at initialization.
     *
     * @public
     * @readonly
     * @memberof TangibleEngine
     */
    get patterns() {
        return this._patterns;
    }
    /**
     * The target used to attach touch event listeners.
     *
     * @defaultValue Window
     * @public
     * @readonly
     * @memberof TangibleEngine
     */
    get target() {
        return this._target;
    }
    /**
     * A list of touches created during TouchEvents.
     *
     * @public
     * @memberof TangibleEngine
     */
    get touches() {
        return this._touches;
    }
    set touches(value) {
        this._touches = value;
    }
    /**
     * Shuts down the TangibleEngine client. Removes registered touch event
     * listeners and closes the socket.
     *
     * @public
     * @memberof TangibleEngine
     */
    deInit() {
        this.unregisterTouchPoints();
        this.client.end();
    }
    /**
     * Initialize the TangibleEngine client. Gets registered patterns from the
     * service, registers touch event listeners, and starts the touch update loop.
     *
     * @public
     * @memberof TangibleEngine
     */
    init() {
        this.getPatterns();
        this.registerTouchPoints();
        if (this.hasWindow) {
            window.requestAnimationFrame(this.update.bind(this));
        }
    }
    /**
     * Retrieves registered patterns from the Tangible Engine service.
     *
     * @private
     * @memberof TangibleEngine
     */
    getPatterns() {
        const payload = { Type: 'Patterns' };
        this.write(payload);
    }
    /**
     * Sets the touches from registered touch events.
     *
     * @param {TouchEvent} touchEvent - The TouchEvent passed by the registered event listener.
     * @private
     * @memberof TangibleEngine
     */
    handleTouch(touchEvent) {
        console.log("touchEvent :: ", touchEvent);
        this.touches = touchEvent.touches;
    }
    /**
     * Registers several touch event listeners on the specified DOM Element, or Window.
     *
     * @private
     * @memberof TangibleEngine
     */
    registerTouchPoints() {
        if (this.hasWindow) {
            this.target.addEventListener('touchend', this.handleTouch.bind(this));
            this.target.addEventListener('touchmove', this.handleTouch.bind(this));
            this.target.addEventListener('touchstart', this.handleTouch.bind(this));
        }
    }
    /**
     * Takes a number and returns 4-byte ArrayBuffer.
     *
     * @private
     * @param {number} num - The number to transform.
     * @returns {ArrayBuffer} An ArrayBuffer representation of the number.
     * @memberof TangibleEngine
     */
    toBufferInt32(num) {
        const arr = new ArrayBuffer(4);
        const view = new DataView(arr);
        view.setUint32(0, num, true);
        return arr;
    }
    /**
     * Transforms an object payload to Buffer for writing to the server via TCP.
     *
     * @private
     * @param {IPayload} payload - The payload to transform.
     * @returns {Buffer} A Buffer holding the payload.
     * @memberof TangibleEngine
     */
    toBufferPayload(payload) {
        const dataString = JSON.stringify(payload);
        const length = Buffer.byteLength(dataString, 'utf8');
        const header = Buffer.from(this.toBufferInt32(length));
        const bufferData = Buffer.from(dataString);
        return Buffer.concat([header, bufferData]);
    }
    /**
     * Transforms a ByteArray representation into a number (int32).
     *
     * @private
     * @param {Buffer} byteArray - The ByteArray to transform.
     * @returns {number} The number.
     * @memberof TangibleEngine
     */
    toInt32ByteArray(byteArray) {
        let value = 0;
        for (let i = byteArray.length - 1; i >= 0; i--) {
            value = value * 256 + byteArray[i];
        }
        return value;
    }
    /**
     * Transforms a TCP Buffer response from the Tangible Engine server into a
     * standard object.
     *
     * @private
     * @param {Buffer} response - The Buffer response from the server.
     * @returns {IResponse} An object representation of the server response.
     * @memberof TangibleEngine
     */
    toObjectBufferPayload(response) {
        const length = this.toInt32ByteArray(response.slice(0, 4));
        const stringData = response.toString('utf8', 4, length + 4);
        if (stringData) {
            try {
                return JSON.parse(stringData);
            }
            catch (error) {
                console.error(error);
            }
        }
    }
    /**
     * Removes several touch event listeners frome the specified DOM Element, or Window.
     *
     * @private
     * @memberof TangibleEngine
     */
    unregisterTouchPoints() {
        if (this.hasWindow) {
            this.target.removeEventListener('touchend', this.handleTouch);
            this.target.removeEventListener('touchmove', this.handleTouch);
            this.target.removeEventListener('touchstart', this.handleTouch);
        }
    }
    /**
     * Sends available touch points to the Tangible Engine service for evaluation.
     *
     * @private
     * @memberof TangibleEngine
     */
    update() {
        const payload = {
            POINTERS: [],
            Type: 'Update'
        };
        if (this.touches) {
            if (this.touches.length > 0) {
                for (let i = 0; i < this.touches.length; i++) {
                    const touch = this.touches.item(i);
                    const scaledPoints = this.scaleFunction(touch.clientX, touch.clientY);
                    payload.POINTERS.push({
                        Id: touch.identifier,
                        X: scaledPoints.x,
                        Y: scaledPoints.y
                    });
                }
            }
        }
        this.write(payload);
        window.requestAnimationFrame(this.update.bind(this));
    }
    /**
     * Sends a formatted message to the Tangible Engine service via TCP.
     *
     * @private
     * @param {IPayload} payload - The message to send.
     * @memberof TangibleEngine
     */
    write(payload) {
        if (!this.isWriting) {
            this.isWriting = true;
            try {
                this.client.write(this.toBufferPayload(payload), 'utf8', () => (this.isWriting = false));
            }
            catch (error) {
                console.error(error);
            }
        }
    }
}
exports.default = TangibleEngine;
