"use strict";
var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : new P(function(resolve) { resolve(result.value); }).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
const readline = require("readline");
const DebugSession_1 = require("./DebugSession");
const UnityDebugClient_1 = require("./UnityDebugClient");
const StackTraceHandler_1 = require("./StackTraceHandler");
const vscode_debugadapter_1 = require("vscode-debugadapter");
const fs_1 = require("fs");
const path_1 = require("path");
class UnityDebugSession extends DebugSession_1.DebugSession {
	constructor() {
		super(...arguments);
		this.unityClient = new UnityDebugClient_1.UnityDebugClient();
		this.stackTraceHandler = new StackTraceHandler_1.StackTraceHandler();
		this.breakpoints = [];
		this.unityClient.context = this;
		this.stackTraceHandler.context = this;
		this.handles = new vscode_debugadapter_1.Handles();
	}
	initializeRequest(response, args) {
		if (this.childProcess) {
			this.printConsole(`initializeRequest:childProcess:OKOK`)
			this.unityClient.context = this;
			this.unityClient.showHandleData = (data) => {
				this.onReceiveLine(data);
			};
			this.unityClient.start(this.childProcess.stdout, this.childProcess.stdin);

		}
		this.printConsole(`initializeRequest:config:${JSON.stringify(this.config)}`)
		this.printConsole(`initializeRequest:args:${JSON.stringify(args)}`)

		//args.clientID = "vscode";
		//args.clientName = "Visual Studio Code - Insiders";
		//args.adapterID = "unity";
		//args.pathFormat = "uri";
		//args.linesStartAt1 = false;
		//args.columnsStartAt1 = true;
		//args.supportsVariableType = true;
		//args.supportsVariablePaging = true;
		//args.supportsRunInTerminalRequest = true;
		//args.locale = "zh-cn";
		//args.supportsProgressReporting = true;
		//args.supportsInvalidatedEvent = true;
		//args.supportsMemoryReferences = true;

		this.initArgs = args;

		response.body = {};
		this.sendResponse(response);
	}
	launchRequest(response, args) {
		this.rootpath = args.cwd;
		this.printConsole(`launchRequest,this.rootpath:${this.rootpath}`)
	}
	attachRequest(response, args) {
		this.rootpath = args.cwd;
		this.printConsole(`attachRequest,this.rootpath:${this.rootpath},args:${JSON.stringify(args)}`)
		args.name = this.config["name"];
		args.type = this.config["type"];
		args.request = "launch";
		this.sendResponse(response);
		this.unityClient.sendRequest("launch", args)
		this.unityClient.sendRequest("initialize", this.initArgs)
		this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
	}
	disconnectRequest(response, args) {
		this.printConsole(`disconnectRequest,this.rootpath:${JSON.stringify(args)}`)
		if (this.childProcess) {
			//this.childProcess.signalCode(-9);
			this.childProcess.kill();
		}
		this.sendDebugAction(response, proto.DebugAction.Stop);// error
	}

	onReceiveLine(line) {
		this.printConsole(`Recv:${line}`)
	}
	dispatchUnkonw(msg) {
	}
	dispatchEvent(e) {
		if (e && e.event == 'output') {
			this.printConsole(`${e.body.output}`)
		}
		if (e && e.event == 'stopped') {
			this.printConsole(`do stopped::`)
		}
	}
	dispatchCommand(msg) {
		switch (msg.command) {
			//-- variables  -- initialize  -- evaluate  - continue   -- next  -- stepIn
			case 'stepIn':
				return;
			case 'continue':
				return;
			case 'next':
				return;
			case 'evaluate':
				return;
			case 'initialize':
				return;
			case 'variables':
				return;
			case 'scopes':
				return;
			case 'launch':
				return;
			case 'stackTrace':  // BreakNotify
				this.breakNotify = msg.body;
				this.sendEvent(new vscode_debugadapter_1.StoppedEvent("breakpoint", 1));
				return;
			case 'setBreakpoints':
				this.breakNotify = msg.body;
				this.sendEvent(new vscode_debugadapter_1.StoppedEvent("breakpoint", 1));
				return;
		}
		this.printConsole(`TODO dispatchCommand:${JSON.stringify(msg)}`)
	}
	dispatchMsg(msg) {
		switch (msg.event) {
			case 'stopped':
				this.unityClient.sendRequest('stackTrace', msg.body);
				return;
			case 'output':
				this.printConsole(`${msg.body.output}`,false);
				return;
			case 'initialized':
				return;
			case 'thread':
				return;
		}
		this.printConsole(`TODO MSG:${JSON.stringify(msg)}`)
	}
	stackTraceRequest(response, args) {
		return __awaiter(this, void 0, void 0, function*() {
			if (this.breakNotify) {
				var stackFrames = yield this.stackTraceHandler.run(this.breakNotify);
				response.body = {
					stackFrames: stackFrames,
					totalFrames: stackFrames.length
				};
			}
			this.sendResponse(response);
		});
	}
	scopesRequest(response, args) {
		//this.printConsole(`[scopesRequest] :args.source: ${JSON.stringify(args)}`)
		this.currentFrameId = args.frameId;
		if (this.breakNotify) {
			if (this.breakNotify.stackFrames && this.breakNotify.stackFrames.length > args.frameId) {
				//this.printConsole(`[scopesRequest] :this.breakNotify.stackFrames: ${JSON.stringify(this.breakNotify.stackFrames)}`)
				const stackData = this.breakNotify.stackFrames[args.frameId];
				this.stackLevel = stackData.id;
				response.body = {
					scopes: [
						{
							name: "Variables",
							variablesReference: this.handles.create(stackData),
							expensive: false
						}
					]
				};
			}
		}
		this.sendResponse(response);
	}
	variablesRequest(response, args) {
		return __awaiter(this, void 0, void 0, function*() {
			if (this.breakNotify) {
				const stackData = this.handles.get(args.variablesReference);
				const children = yield this.stackTraceHandler.computeChildren(stackData, args.variablesReference);
				response.body = {
					variables: children
				};
			}
			this.sendResponse(response);
		});
	}
	evaluateRequest(response, args) {
		return __awaiter(this, void 0, void 0, function*() {
			const evalResp = yield this.stackTraceHandler.eval(args.expression, this.stackLevel)
			if (evalResp.success) {
				const variable = evalResp.body;
				response.body = {
					result: variable.result,
					type: variable.type,
					variablesReference: variable.variablesReference
				};
			}
			else {
				response.body = {
					result: evalResp.body.value,
					type: 'string',
					variablesReference: 0
				};
			}
			this.sendResponse(response);
		});
	}
	setBreakPointsRequest(response, args) {
		//this.printConsole(`setBreakPointsRequest,args:${JSON.stringify(args)}`)
		const source = args.source;
		const bpsProto = [];
		if (source && source.path) {
			const path = path_1.normalize(source.path);
			const bps = args.breakpoints || [];
			const bpsResp = [];
			for (let i = 0; i < bps.length; i++) {
				const bp = bps[i];
				bpsProto.push({
					file: path,
					line: bp.line
				});
				const bpResp = new vscode_debugadapter_1.Breakpoint(true, bp.line);
				bpResp.id = this.breakPointId++;
				bpsResp.push(bpResp);
			}
			response.body = { breakpoints: bpsResp };
			this.breakpoints = this.breakpoints.filter(v => v.file !== path);
			this.breakpoints = this.breakpoints.concat(bpsProto);
		}
		args.sourceModified = true
		this.unityClient.sendRequest("setBreakpoints", args)
		this.sendResponse(response);
	}
	threadsRequest(response) {
		response.body = {
			threads: [
				new vscode_debugadapter_1.Thread(1, "thread 1")
			]
		};
		this.sendResponse(response);
	}

	pauseRequest(response, args) {
		//this.printConsole(`[pauseRequest] :args.source: ${JSON.stringify(args)}`)
		this.unityClient.sendRequest('pause', args)
		this.sendResponse(response);
	}
	continueRequest(response, args) {
		//this.printConsole(`[continueRequest] :args.source: ${JSON.stringify(args)}`)
		this.unityClient.sendRequest('continue', args)
		this.sendResponse(response);
	}
	nextRequest(response, args) {
		//this.printConsole(`[nextRequest] :args.source: ${JSON.stringify(args)}`)
		this.unityClient.sendRequest('next', args)
		this.sendResponse(response);
	}
	stepInRequest(response, args) {
		//this.printConsole(`[stepInRequest] :args.source: ${JSON.stringify(args)}`)
		this.unityClient.sendRequest('stepIn', args)
		this.sendResponse(response);
	}
	stepOutRequest(response, args) {
		//this.printConsole(`[stepOutRequest] :args.source: ${JSON.stringify(args)}`)
		this.unityClient.sendRequest('stepOut', args)
		this.sendResponse(response);
	}
}
exports.UnityDebugSession = UnityDebugSession;
