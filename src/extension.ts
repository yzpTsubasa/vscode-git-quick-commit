import * as vscode from 'vscode';
import quickCommit from './command/quickCommit';
import {ICommand} from './command/Command';


function handleSuccess(result: any) {
	if (result) {
			vscode.window.showInformationMessage(result);
	}
}


function handleError(err: Error) {
	if (err && err.message) {
			vscode.window.showErrorMessage(err.message);
	}
	return err;
}


function register(context: vscode.ExtensionContext, command: ICommand, commandName: string) {
	const proxy = (...args: any) => command().then(handleSuccess).catch(handleError);
	const disposable = vscode.commands.registerCommand(`vscode-git-quick-commit.${commandName}`, proxy);

	context.subscriptions.push(disposable);
}


export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "vscode-git-quick-commit" is now active!');
	register(context, quickCommit, 'quickCommit');
}


// this method is called when your extension is deactivated
export function deactivate() {}
