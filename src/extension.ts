import * as vscode from "vscode";
import * as fs from "fs";

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
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, "resources"),
        this._extensionUri,
      ],
    };

    // 1. Return the HTML immediately so the sidebar appears
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // 2. Load and push data ASYNCHRONOUSLY
    const jsonPath = vscode.Uri.joinPath(
      this._extensionUri,
      "resources",
      "glyphs.json",
    );

    // Using a small timeout ensures the main.js listener is ready
    setTimeout(() => {
      try {
        const jsonData = fs.readFileSync(jsonPath.fsPath, "utf8");
        webviewView.webview.postMessage({
          command: "loadData",
          data: JSON.parse(jsonData),
        });
      } catch (err) {
        console.error("Failed to load glyphs:", err);
      }
    }, 100);

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
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "resources", "main.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "resources", "style.css"),
    );
    const fontUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "resources", "FiraCode_NF.ttf"),
    );

    const htmlPath = vscode.Uri.joinPath(
      this._extensionUri,
      "resources",
      "picker.html",
    );
    let html = fs.readFileSync(htmlPath.fsPath, "utf8");

    // CLEANUP: Removed the blocking postMessage from here
    return html
      .replace(/\${scriptUri}/g, scriptUri.toString())
      .replace(/\${styleUri}/g, styleUri.toString())
      .replace(/\${fontUri}/g, fontUri.toString())
      .replace(/\${cspSource}/g, webview.cspSource);
  }
}
