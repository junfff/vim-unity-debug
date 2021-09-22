"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_debugadapter_1 = require("vscode-debugadapter");
const path = require("path");
class DebugSession extends vscode_debugadapter_1.LoggingDebugSession {
    constructor() {
        super("emmy.debug.txt");
        this.ext = ['.lua'];
        this._findFileSeq = 0;
        this._fileCache = new Map();
    }
    log(obj) {
        this.sendEvent(new vscode_debugadapter_1.Event("log", obj));
    }
    printConsole(msg, newLine = true) {
        if (newLine) {
            msg += "\n";
        }
        this.sendEvent(new vscode_debugadapter_1.OutputEvent(msg));
    }
    customRequest(command, response, args) {
        if (command === 'findFileRsp') {
            this.emit('findFileRsp', args);
        }
        else {
            this.emit(command);
        }
    }
    findFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            if (path.isAbsolute(file)) {
                return file;
            }
            const r = this._fileCache.get(file);
            if (r) {
                return r;
            }
            const seq = this._findFileSeq++;
            this.sendEvent(new vscode_debugadapter_1.Event('findFileReq', { file: file, ext: this.ext, seq: seq }));
            return new Promise((resolve, c) => {
                const listener = (body) => {
                    if (seq === body.seq) {
                        this.removeListener('findFileRsp', listener);
                        const files = body.files;
                        if (files.length > 0) {
                            this._fileCache.set(file, files[0]);
                            resolve(files[0]);
                        }
                        else {
                            resolve(file);
                        }
                    }
                };
                this.addListener('findFileRsp', listener);
            });
        });
    }
}
exports.DebugSession = DebugSession;
//# sourceMappingURL=DebugSession.js.map

