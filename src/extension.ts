import * as vscode from "vscode";
import * as fs from "fs"; // Required to read your picker.html

export function activate(context: vscode.ExtensionContext) {
  const provider = new NerdFontProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "nerd-font-picker-view",
      provider,
    ),
  );
}

class NerdFontProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    // Pass the webview to the generator
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit((editBuilder) => {
          editBuilder.insert(editor.selection.active, data.value);
        });
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // 1. Generate the URIs
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "resources", "main.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "resources", "style.css"),
    );
    const fontUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "resources", "FiraCode_NF.ttf"),
    );

    // 2. Read the HTML file
    const htmlPath = vscode.Uri.joinPath(
      this._extensionUri,
      "resources",
      "picker.html",
    );
    let html = fs.readFileSync(htmlPath.fsPath, "utf8");

    // 3. Swap placeholders
    // We use a simple regex to replace ${variableName} in your HTML file
    return html
      .replace(/\${scriptUri}/g, scriptUri.toString())
      .replace(/\${styleUri}/g, styleUri.toString())
      .replace(/\${fontUri}/g, fontUri.toString())
      .replace(/\${cspSource}/g, webview.cspSource);
  }
}
