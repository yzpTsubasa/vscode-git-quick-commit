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
  let text = editor.selections.map(selection => editor && editor.document.getText(selection)).join("\n").trim();
  if (!text) {
    text = config.get('defaultCommitMsg', '');
  }
  if (!text && editor.selection.isEmpty && config.get('autoUseTrimLine')) {
    text = editor.selections.map(selection => {
      let tmp = "";
      let line = editor && editor.document.lineAt(selection.start);
      tmp = line && line.text.trim() || "";
      let splitSeparator = config.get("splitSeparator", "");
      if (splitSeparator) {
        let joinSeparator = config.get("joinSeparator", "");
        let splitUnitsLengthLimit = config.get("splitUnitsLengthLimit", 0);
        let splitUnitsFilters: string[] = config.get("splitUnitsFilters", []);
        tmp = tmp.split(splitSeparator)
          .map(v => v.trim())
          .filter(v => { 
            return v 
              && v.length > 0 
              && (splitUnitsLengthLimit <= 0 || v.length <= splitUnitsLengthLimit) 
              && !splitUnitsFilters.includes(v)
          })
          .join(joinSeparator);
      }
      return tmp;
    }).join("\n").trim();
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

  let commitCmd = `git add . && git commit`;
  let inputs = input.split("\n")
  for (let v of inputs) {
    commitCmd += ` -m "${v}"`;
  }
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