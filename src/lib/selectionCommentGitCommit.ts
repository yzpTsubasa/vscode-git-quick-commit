import * as vscode from 'vscode';
const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);

export default async (options: any): Promise<string> => {
  let isShowDialog = options && options.showDialog ? true : false;

  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    throw new Error('activeTextEditorが不明です。');
  }
  let workspaceFoler = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  let workspacePath = workspaceFoler && workspaceFoler.uri.fsPath;
  if (!workspacePath) {
    workspacePath = vscode.workspace.rootPath;
  }
  if (!workspacePath) {
    throw new Error("workspacePathが不明です。");
  }

  let config = vscode.workspace.getConfiguration('vscode-git-quick-commit-v2', vscode.Uri.parse(workspacePath));
  // 選択範囲テキスト取得
  let text = editor.document.getText(editor.selection);
  if (!text) {
    text = config.get('defaultCommitMsg', '');
  }
  if (!text && editor.selection.isEmpty && config.get('autoUseTrimLine')) {
    let line = editor.document.lineAt(editor.selection.start);
    text = line && line.text.trim();
  }
  if (!text) {
    throw new Error('コミットテキストを選択してください。');
  }
  let input: string | undefined = text;

  if (isShowDialog) {
    input = await vscode.window.showInputBox({
      prompt: 'コミットメッセージを入力してください＊＊',
      value: text
    });
    if (!input) {
      return Promise.resolve(''); // cancel
    }
  }

  vscode.workspace.saveAll();


  let commitCmd = `git add . && git commit -m"${input}"`;
  let pushCmd = `git push`;
  return exec(commitCmd, { cwd: workspacePath })
    .then(() => {
      if (!config.get("noTip")) {
        vscode.window.showInformationMessage(`Commit ${input} ${workspacePath}`);
      }
    })
    .finally(() => {
      if (config.get("autoPush")) {
        exec(pushCmd, { cwd: workspacePath })
        .then(() => {
          if (!config.get("noTip")) {
            vscode.window.showInformationMessage(`Push ${workspacePath}`);
          }
        })
      }
    });
};