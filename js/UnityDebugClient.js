"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UnityDebugClient {
	constructor() {
		this._pendingRequests = new Map();
	}
	_emitEvent(str) {
		this.context.printConsole("UnityDebugClient:" + str);
	}
	start(inStream, outStream) {
		this._sequence = 1;
		this._writableStream = outStream;
		this._rawData = Buffer.alloc(0);
		inStream.on('data', (data) => this._handleData(data));
		inStream.on('close', () => {
			this._emitEvent('close');
		});
		inStream.on('error', (error) => {
			this._emitEvent('inStream error: ' + (error && error.message));
		});
		outStream.on('error', (error) => {
			this._emitEvent('outStream error: ' + (error && error.message));
		});
		inStream.resume();
	}
	stop() {
		if (this._writableStream) {
			this._writableStream.end();
		}
	}
	sendEvent(event) {
		this._send('event', event);
	}
	sendResponse(response) {
		if (response.seq > 0) {
			console.error(`attempt to send more than one response for command ${response.command}`);
		}
		else {
			this._send('response', response);
		}
	}
	sendRequest(command, args, timeout, cb) {
		const request = {
			command: command
		};
		if (args && Object.keys(args).length > 0) {
			request.arguments = args;
		}
		if (!this._writableStream) {
			this._emitEvent('sendRequest: No writableStream');
			return;
		}
		this._send('request', request);
		if (cb) {
			this._pendingRequests.set(request.seq, cb);
			const timer = setTimeout(() => {
				clearTimeout(timer);
				const clb = this._pendingRequests.get(request.seq);
				if (clb) {
					this._pendingRequests.delete(request.seq);
					clb('request:timeout');
				}
			}, timeout);
		}
	}
	// ---- protected ----------------------------------------------------------
	dispatchRequest(request) {
		if (this.context) {
			this.context.dispatchMsg(request);
		}
	}
	// ---- private ------------------------------------------------------------
	_send(typ, message) {
		message.type = typ;
		message.seq = this._sequence++;
		if (this._writableStream) {
			const json = JSON.stringify(message);
			//this.context.printConsole(`[Send]:${json}`)
			this._writableStream.write(`Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`, 'utf8');
		}
	}
	_handleData(data) {
		var buffer2 = Buffer.from((data));
		this._rawData = Buffer.concat([this._rawData, buffer2]);
		while (true) {
			if (this._contentLength >= 0) {
				if (this._rawData.length >= this._contentLength) {
					const message = this._rawData.toString('utf8', 0, this._contentLength);
					this._rawData = this._rawData.slice(this._contentLength);
					this._contentLength = -1;
					if (message.length > 0) {
						try {
							//this.context.printConsole(`[Recv]:${message}`);
							let msg = JSON.parse(message);
							if (msg.type === 'request' || msg.type == 'event') {
								this.dispatchRequest(msg);
							}
							else if (msg.type === 'response') {
								const response = msg;
								const clb = this._pendingRequests.get(response.request_seq);
								if (clb) {
									this._pendingRequests.delete(response.request_seq);
									clb(response);
								}
							}
							if (msg.command) {
								this.context.dispatchCommand(msg);
							}
						}
						catch (e) {
							if (e && e.message) {
								this.context.printConsole(`Error handling data:${e.message}`);
							}
							//this._emitEvent('Error handling data: ' + (e && e.message));
						}
					}
					continue; // there may be more complete messages to process
				}
			}
			else {
				const idx = this._rawData.indexOf(UnityDebugClient.TWO_CRLF);
				if (idx !== -1) {
					const header = this._rawData.toString('utf8', 0, idx);
					const lines = header.split('\r\n');
					for (let i = 0; i < lines.length; i++) {
						const pair = lines[i].split(/: +/);
						if (pair[0] == 'Content-Length') {
							this._contentLength = +pair[1];
						}
					}
					this._rawData = this._rawData.slice(idx + UnityDebugClient.TWO_CRLF.length);
					continue;
				}
			}
			break;
		}
	}
}
UnityDebugClient.TWO_CRLF = '\r\n\r\n';
exports.UnityDebugClient = UnityDebugClient;

