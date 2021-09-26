
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
const vscode_debugadapter_1 = require("vscode-debugadapter");
class StackTraceHandler {
	constructor() {
	}
	getScopes(frameId) {
		return __awaiter(this, void 0, void 0, function*() {
			const args = {
				frameId: frameId,
			};
			return new Promise((resolve, reject) => {
				const listener = (msg) => {
					resolve(msg);
				};
				this.context.unityClient.sendRequest("scopes", args, 500, listener)
			});
		});
	}
	getVariable(variablesReference) {
		return __awaiter(this, void 0, void 0, function*() {
			const args = {
				variablesReference: variablesReference,
			};
			return new Promise((resolve, reject) => {
				const listener = (msg) => {
					resolve(msg);
				};
				this.context.unityClient.sendRequest("variables", args, 500, listener)
			});
		});
	}
	eval(expression, frameId) {
		return __awaiter(this, void 0, void 0, function*() {
			const args = {
				expression: expression,
				frameId: frameId,
			};
			return new Promise((resolve, reject) => {
				const listener = (msg) => {
					resolve(msg);
				};
				this.context.unityClient.sendRequest("evaluate", args, 500, listener)
			});
		});
	}
	computeChildren(stackData, variablesReference) {
		return __awaiter(this, void 0, void 0, function*() {
			var children = [];
			if (stackData == null || typeof (stackData) == undefined || typeof (stackData) == "undefined") {
				const variable = yield this.getVariable(variablesReference)
				const objectValues = variable.body.variables
				for (let k = 0; k < objectValues.length; k++) {
					const ov = objectValues[k];
					children.push(ov)
				}
			}
			else {
				const arr = stackData.localVariables;
				if (arr) {
					for (let i = 0; i < arr.length; i++) {
						const variable = arr[i];
						children.push(variable);
						const evalResp = yield this.eval(variable.name, stackData.id);
						if (evalResp.success) {
							children.push()
						}
					}
				}
			}
			return children;
		});
	}
	run(breakNotify) {
		return __awaiter(this, void 0, void 0, function*() {
			this.breakNotify = breakNotify;
			if (this.breakNotify) {
				const stackFrames = [];
				const arr = this.breakNotify.stackFrames;
				if (arr) {
					for (let i = 0; i < arr.length; i++) {
						const stack = arr[i];
						stack.localVariables = [];
						const scopeResp = yield this.getScopes(stack.id);
						if (scopeResp.success) {
							const scopes = scopeResp.body.scopes;
							for (let j = 0; j < scopes.length; j++) {
								const scope = scopes[j];
								// req localVariables  -- variables - variablesReference
								const variable = yield this.getVariable(scope.variablesReference)
								const objectValues = variable.body.variables
								for (let k = 0; k < objectValues.length; k++) {
									const ov = objectValues[k];
									stack.localVariables.push(ov)
								}
							}
						}
						stack.upvalueVariables = [];
						let path = stack.source.path;
						if (!path) {
							continue;
						}
						let source = new vscode_debugadapter_1.Source(stack.source.name, path);
						stackFrames.push(new vscode_debugadapter_1.StackFrame(i, stack.name, source, stack.line));
					}
				}
				return stackFrames
			}
		});
	}

}
exports.StackTraceHandler = StackTraceHandler;
