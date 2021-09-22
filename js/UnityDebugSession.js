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
const vscode_debugadapter_1 = require("vscode-debugadapter");
const fs_1 = require("fs");
const path_1 = require("path");
class UnityDebugSession extends DebugSession_1.DebugSession {
	constructor() {
		super(...arguments);
		this.unityClient = new UnityDebugClient_1.UnityDebugClient();
		this.breakpoints = [];
		this.unityClient.context = this;
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
		//this.readClient()
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
	readClient() {
		readline.createInterface({
			input: this.childProcess.stdout,
			output: this.childProcess.stdin
		})
			.on("line", line => this.onReceiveLine(line));
		//process.on('close', hadErr => this.onSocketClose())
		//.on('error', err => this.onSocketClose());
	}
	launchRequest(response, args) {
		this.rootpath = args.cwd;
		this.printConsole(`launchRequest,this.rootpath:${this.rootpath}`)
		//this.readClient();
	}
	attachRequest(response, args) {
		this.sendEvent(new vscode_debugadapter_1.Event('showWaitConnection'));


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
			this.childProcess.signalCode(-9);
		}
		this.sendDebugAction(response, proto.DebugAction.Stop);
	}

	onReceiveLine(line) {
		this.printConsole(`Recv:${line}`)
		if (line != null) {
			//this.processData(line);
		}
	}
	dispatchUnkonw(msg) {
		//this.printConsole(`dispatchUnkonw:${JSON.stringify(msg)}`)
	}
	dispatchEvent(e) {
		//this.printConsole(`do stopped::AAA`)
		if (e && e.event == 'output') {
			this.printConsole(`${e.body.output}`)
		}
		if (e && e.event == 'stopped') {
			this.printConsole(`do stopped::`)
		}
	}
	dispatchCommand(msg) {
		switch (msg.command) {
			case 'stackTrace':
				//TODO CMD:{"success":true,"message":null,"request_seq":4,"command":"stackTrace","body":{"stackFrames":[{"id":1000,"source":{"name":"AvatarManager.cs","path":"/home/ljf/workspace/wonder_party_new/avatarProject/Assets/Script/AvatarManager.cs","sourceReference":0,"presentationHint":"normal"},"line":424,"column":0,"name":"AvatarManager.Update","presentationHint":"normal"}],"totalFrames":1},"seq":191,"type":"response"}
				this.breakNotify = msg.body;
				this.sendEvent(new vscode_debugadapter_1.StoppedEvent("breakpoint", 1));
				return;
			case 'setBreakpointsB':
				//TODO CMD:{"success":true,"message":null,"request_seq":6,"command":"setBreakpoints","body":{"breakpoints":[]},"seq":193,"type":"response"}
				//this.breakNotify = msg.body;
				//this.sendEvent(new vscode_debugadapter_1.StoppedEvent("breakpoint", 1));
				return;
		}
		this.printConsole(`TODO CMD:${JSON.stringify(msg)}`)
	}
	dispatchMsg(msg) {
		//console.log(`${msg}`);
		switch (msg.event) {
			case 'stopped':
				//this.printConsole(`stopped => msg:${JSON.stringify(msg)}`);
				this.unityClient.sendRequest('stackTrace', msg.body);
				return;
			case 'output':
				//this.printConsole(`${msg.body.output}`)
				return;
			case 'initialized':
				//TODO:{"seq":6,"type":"event","event":"initialized","body":null}
				return;
			case 'thread':
				//TODO:{"seq":188,"type":"event","event":"thread","body":{"reason":"exited","threadId":8}}
				return;
		}
		this.printConsole(`TODO MSG:${JSON.stringify(msg)}`)
		//Recv:{"seq":152,"type":"event","event":"stopped","body":{"threadId":1,"reason":"breakpoint","text":null,"allThreadsStopped":true}}
	}
	stackTraceRequest(response, args) {
			response.body = {
					stackFrames: this.breakNotify.stackFrames,
					totalFrames: this.breakNotify.stackFrames.length
				};
		this.printConsole(`[stackTraceRequest] :args.source: ${JSON.stringify(args)}`)
	}
	scopesRequest(response, args) {
		this.printConsole(`[scopesRequest] :args.source: ${JSON.stringify(args)}`)
		this.sendResponse(response);
	}
	variablesRequest(response, args) {
		this.printConsole(`[variablesRequest] :args.source: ${JSON.stringify(args)}`)
		this.sendResponse(response);
	}
	evaluateRequest(response, args) {
		this.printConsole(`[evaluateRequest] :args.source: ${JSON.stringify(args)}`)
		this.sendResponse(response);
	}
	setBreakPointsRequest(response, args) {
		this.printConsole(`setBreakPointsRequest,args:${JSON.stringify(args)}`)

		//const source = args.source;
		//const bpsProto = [];
		//if (source && source.path) {
		//const path = path_1.normalize(source.path);
		//const bps = args.breakpoints || [];
		//const bpsResp = [];
		//for (let i = 0; i < bps.length; i++) {
		//const bp = bps[i];
		//bpsProto.push({
		//file: path,
		//line: bp.line
		//});
		//const bpResp = new vscode_debugadapter_1.Breakpoint(true, bp.line);
		//bpResp.id = this.breakPointId++;
		//bpsResp.push(bpResp);
		//}
		//response.body = { breakpoints: bpsResp };
		//this.breakpoints = this.breakpoints.filter(v => v.file !== path);
		//this.breakpoints = this.breakpoints.concat(bpsProto);
		//}

		args.sourceModified = false
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
		this.printConsole(`[pauseRequest] :args.source: ${JSON.stringify(args)}`)
		this.sendResponse(response);
	}
	continueRequest(response, args) {
		this.printConsole(`[continueRequest] :args.source: ${JSON.stringify(args)}`)
		this.sendResponse(response);
	}
	nextRequest(response, args) {
		this.printConsole(`[nextRequest] :args.source: ${JSON.stringify(args)}`)
		this.sendResponse(response);
	}
	stepInRequest(response, args) {
		this.printConsole(`[stepInRequest] :args.source: ${JSON.stringify(args)}`)
		this.sendResponse(response);
	}
	stepOutRequest(response, args) {
		this.printConsole(`[stepOutRequest] :args.source: ${JSON.stringify(args)}`)
		this.sendResponse(response);
	}
}
exports.UnityDebugSession = UnityDebugSession;
