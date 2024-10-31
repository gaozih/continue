import * as vscode from 'vscode';
import { EXTENSION_NAME } from "../util/constants";
import * as cp from 'child_process';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os'
import * as util from 'util'

let sshProcess: cp.ChildProcessWithoutNullStreams | null = null;
const outputChannel = vscode.window.createOutputChannel(
    "Continue - SSH Status",
  );

export function startSSHTunnel() {
    const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
    const remoteHost = config.get('sshRemoteHost') as string;
    const remotePort = config.get('sshRemotePort') as number;
    const localPort = config.get('sshLocalPort') as number;
    const remoteForwardPort = config.get('sshRemoteForwardPort') as number;
    const username = config.get('sshUsername') as string;
    const privateKeyPath = config.get('sshPrivateKeyPath') as string;

    if (!fs.existsSync(privateKeyPath)) {
        vscode.window.showErrorMessage(`私钥路径不存在: ${privateKeyPath}`);
        return;
    }
    let usePort: boolean = false;
    
    usePort = false;
    stopSSHTunnel();

    console.log('started ssh tunnel')

    const sshCommand = `-NL ${localPort}:0.0.0.0:${remoteForwardPort} ${username}@${remoteHost} -p ${remotePort} -i ${privateKeyPath}`;
    return new Promise((resolve, reject) => {
        //vscode.window.showInformationMessage(`SSH Tunnel start. ssh ${sshCommand}`);
        outputChannel.appendLine(`SSH Tunnel start. ssh ${sshCommand}`)
        sshProcess = cp.spawn('ssh', sshCommand.split(' '));
        
        sshProcess.stdout.on('data', (data) => {
            //vscode.window.showInformationMessage(`SSH Tunnel: ${data}`);
            outputChannel.appendLine(`SSH Tunnel: ${data}`)
        });
        sshProcess.stderr.on('data', (data) => {
            //vscode.window.showErrorMessage(`SSH Tunnel Error: ${data}`);
            outputChannel.appendLine(`SSH Tunnel Error: ${data}`)
        });
        sshProcess.on('close', (code) => {
            if (code === 0) {
                //vscode.window.showInformationMessage('SSH Tunnel closed successfully.');
                outputChannel.appendLine(`SSH Tunnel closed successfully.`)
            } else {
                //vscode.window.showErrorMessage(`SSH Tunnel closed with code ${code}.`);
                outputChannel.appendLine(`SSH Tunnel closed with code ${code}.`)
            }
            resolve([]);
        });
    });
    
}

function stopSSHTunnel() {
    if (sshProcess) {
        sshProcess.kill();
        sshProcess = null;
        //vscode.window.showInformationMessage('SSH Tunnel stopped.');
        outputChannel.appendLine('SSH Tunnel stopped');
    }
}

vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration(EXTENSION_NAME)) {
        startSSHTunnel();
    }
});

function checkPort() {
    const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
    const port = config.get('sshLocalPort') as number;
    let command;
    if (os.platform() === 'win32') {
      // Windows平台使用findstr
      command = `netstat -an | findstr :${port}`;
    } else {
      // macOS和Linux平台使用grep
      command = `netstat -an | grep ${port}`;
    }
    cp.exec(command, (error, stdout, stderr) =>{
        if (error)
        {
            console.error(error);
            outputChannel.appendLine(`Linstening Error: Port ${port} is ${error}`);
            vscode.commands.executeCommand("continue.sshTunnel");
            return;
        }
        const isRunning = stdout.includes(port.toString());
        if (isRunning) {
            console.log(`Port ${port} is in use`);
            outputChannel.appendLine(`Linstening: Port ${port} is in use`);
            return;
        }else{
            console.log(`Port ${port} is free`);
            // 端口未被占用，执行VS Code命令
            vscode.commands.executeCommand("continue.sshTunnel");
            
        }
    });
}

setInterval(checkPort, 10000);