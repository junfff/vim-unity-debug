import { exec } from 'child_process';
import * as UnityDebugSession from './UnityDebugSession';

function run_debug(config,childProcess2) {
	const session = new UnityDebugSession.UnityDebugSession(false);
	process.on('SIGTERM', () => {
		session.shutdown();
	});
	session.config = config
	session.childProcess = childProcess2
	session.start(process.stdin, process.stdout);
}


function start_unity_debug() {
	let execCommand = "";
	if (process.platform !== 'win32')
		execCommand = "mono ";
	const  extensionPath = "~/.vscode-oss/extensions/unity.unity-debug-3.0.2";
	exec(execCommand + extensionPath + "/bin/UnityDebug.exe list", async function(error, stdout, stderr) {
		const processes = [];
		const lines = stdout.split("\n");
		for (let i = 0; i < lines.length; i++) {
			if (lines[i]) {
				processes.push(lines[i]);
			}
		}
		if (processes.length == 0) {
			console.log("No Unity Process Found.");
		} else {
			var chosen = processes[0];
			if (!chosen) {
				return;
			}
			const config = {
				"name": chosen,
				"request": "launch",
				"type": "unity",
			}
			var childProcess2 = exec(execCommand + extensionPath + "/bin/UnityDebug.exe",null);
			let response = await run_debug(config,childProcess2);
			console.log("8");

			console.log("debug ended: " + response);
		}
	});
}

start_unity_debug()
