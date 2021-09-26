# vim-unity-debug
okok

![debugging-screenshot](https://github.com/junfff/vim-unity-debug/blob/main/img/vim-unity-debug.jpg)

Require: vimspector and  unity.unity-debug-3.0.2
https://github.com/puremourning/vimspector

1. VsCode install unity.unity-debug-3.0.2
2. .gadgets.json
```
      "unity_debug": {
      "command": [
        "node",
        "your path /vim-unity-debug/js/UnityDebugAdapter.js"
      ],
      "configuration": {
        "extensionPath": "~/.vscode-insiders/extensions/unity.unity-debug-3.0.2",
      },
      "name": "unity_debug"
    },


```
3. .vimspector.json
```
{
  "$schema": "https://puremourning.github.io/vimspector/schema/vimspector.schema.json#",
  "configurations": {
      "UntiyDebug":    {
      "adapter": "unity_debug",
      "configuration":{
            "type": "unity_debug",
            "request": "attach",
            "name": "Unity Editor",
            "cwd": "${workspaceFolder}",
            "path": "${workspaceFolder}/Library/EditorInstance.json",
        }
    }
  }
}

```

https://github.com/Unity-Technologies/vscode-unity-debug
https://github.com/EmmyLua/VSCode-EmmyLua

