import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function uri(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  filePath: string
) {
  return webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'out', 'webview', filePath)
  );
}

export function getHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri
): string {

  const indexPath = path.join(
    extensionUri.fsPath,
    'out',
    'webview',
    'index.html'
  );

  let html = fs.readFileSync(indexPath, 'utf8');

  html = html
    .split('styles.css').join(uri(webview, extensionUri, 'styles.css').toString())
    .split('config.js').join(uri(webview, extensionUri, 'config.js').toString())
    .split('main.js').join(uri(webview, extensionUri, 'main.js').toString())
    .split('plot.js').join(uri(webview, extensionUri, 'plot.js').toString())
    .split('smoothing.js').join(uri(webview, extensionUri, 'smoothing.js').toString())
    .split('vendor/uPlot.iife.min.js').join(uri(webview, extensionUri, 'vendor/uPlot.iife.min.js').toString())
    .split('vendor/uPlot.min.css').join(uri(webview, extensionUri, 'vendor/uPlot.min.css').toString());

  return html;
}