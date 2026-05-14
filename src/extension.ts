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
      // This allows the webview to access your CSS, JS, and Fonts
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, "resources"),
        this._extensionUri,
      ],
    };

    // 1. Set the initial HTML structure
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // 2. Load the Glyph data from the resources folder
    const jsonPath = vscode.Uri.joinPath(
      this._extensionUri,
      "resources",
      "glyphs.json",
    );

    try {
      const jsonData = fs.readFileSync(jsonPath.fsPath, "utf8");

      // We use a small delay to ensure main.js is loaded and listening
      setTimeout(() => {
        webviewView.webview.postMessage({
          command: "loadData",
          data: JSON.parse(jsonData),
        });
      }, 500);
    } catch (err) {
      console.error("Failed to load glyphs.json:", err);
    }

    // 3. Handle messages sent from the Webview (insertion logic)
    webviewView.webview.onDidReceiveMessage((data) => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit((editBuilder) => {
          // Inserts the selected glyph at the current cursor position
          editBuilder.insert(editor.selection.active, data.value);
        });
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Generate the internal Webview URIs for our resources
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "resources", "main.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "resources", "style.css"),
    );
    const fontUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "resources", "Firacode_NF.ttf"),
    );
    // 1. Read the CSS file as text
const stylePath = vscode.Uri.joinPath(this._extensionUri, "resources", "style.css");
let styleContents = fs.readFileSync(stylePath.fsPath, "utf8");

// 2. Manually replace the fontUri inside the CSS string
styleContents = styleContents.replace(/\${fontUri}/g, fontUri.toString());

    // Read the HTML scaffold
    const htmlPath = vscode.Uri.joinPath(
      this._extensionUri,
      "resources",
      "picker.html",
    );
    let html = fs.readFileSync(htmlPath.fsPath, "utf8");

    // Replace the placeholders with the actual generated URIs
    return html
      .replace(/\${scriptUri}/g, scriptUri.toString())
      .replace("</head>", `<style>${styleContents}</style></head>`)
      .replace(/\${fontUri}/g, fontUri.toString())
      .replace(/\${cspSource}/g, webview.cspSource);
  }
}
