import * as vscode from 'vscode';
import { EXTENSION_NAME } from "../util/constants";
import * as cp from 'child_process';
import * as fs from 'fs';

let sshProcess: cp.ChildProcessWithoutNullStreams | null = null;


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

    // 停止之前的进程
    stopSSHTunnel();

    const sshCommand = `-NL ${localPort}:0.0.0.0:${remoteForwardPort} ${username}@${remoteHost} -p ${remotePort} -i ${privateKeyPath}`;
    return new Promise((resolve, reject) => {
        vscode.window.showInformationMessage(`SSH Tunnel start. ssh ${sshCommand}`);
        sshProcess = cp.spawn('ssh', sshCommand.split(' '));
        
        sshProcess.stdout.on('data', (data) => {
            vscode.window.showInformationMessage(`SSH Tunnel: ${data}`);
        });
        sshProcess.stderr.on('data', (data) => {
            vscode.window.showErrorMessage(`SSH Tunnel Error: ${data}`);
        });
        sshProcess.on('close', (code) => {
            if (code === 0) {
                vscode.window.showInformationMessage('SSH Tunnel closed successfully.');
            } else {
                vscode.window.showErrorMessage(`SSH Tunnel closed with code ${code}.`);
            }
            resolve([]);
        });
    });
}

function stopSSHTunnel() {
    if (sshProcess) {
        sshProcess.kill();
        sshProcess = null;
        vscode.window.showInformationMessage('SSH Tunnel stopped.');
    }
}

vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration(EXTENSION_NAME)) {
        startSSHTunnel();
    }
});