import * as fs from 'fs';
import * as path from 'path';

export function getHtml(): string {
  const htmlPath = path.join(__dirname, 'webview.html');
  return fs.readFileSync(htmlPath, 'utf8');
}
