import * as vscode from 'vscode';
import { sampleCpuMem } from './webview/monitor';
import { hasNvidiaGpu, sampleNvidiaGpu } from './webview/gpu';
import { getHtml } from './webview/html';

function safeNum(v: any) {
  return Number.isFinite(v) ? v : null;
}

interface Sample {
  x: number; // timestamp
  cpu: number | null;
  mem: number | null;
  gpu: number | null;
  gpuMem: number | null;
}

class ResourceMonitorProvider implements vscode.WebviewViewProvider {
  private webviewView?: vscode.WebviewView;
  private hasGpu: boolean = false;
  public refreshRate: number = 1;
  private timer?: NodeJS.Timeout;
  private samples: Sample[] = [];
  private maxHistorySeconds: number = 180;
  private smoothRate: number = 1;
  private pollingStarted: boolean = false;
  private ctx: vscode.ExtensionContext;

  // Remove async call from constructor
  constructor(ctx: vscode.ExtensionContext) {
    this.ctx = ctx;
  }

  async initialize() {
    this.hasGpu = await hasNvidiaGpu();
    const config = vscode.workspace.getConfiguration('sysmon');
    this.refreshRate = config.get<number>('refreshRate', 1);
    this.maxHistorySeconds = config.get<number>('historySeconds', 180);
    this.smoothRate = config.get<number>('smoothRate', 1);
    // Do not start polling here; wait for webview ready
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.webviewView = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = getHtml(webviewView.webview, this.ctx.extensionUri);
    // Listen for messages from webview
    webviewView.webview.onDidReceiveMessage(message => {
      // vscode.window.showInformationMessage(message.command);
      if (message.command === 'ready') {
        this.postConfig();
        this.postFullHistory();
        if (!this.pollingStarted) {
          this.startPolling();
          this.pollingStarted = true;
        }
      } else if (message.command === 'openSettings') {
        // vscode.window.showInformationMessage('Settings button clicked! Opening settings...');
        vscode.commands.executeCommand('workbench.action.openSettings', 'sysmon');
      }
    });
    // Listen for visibility changes
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        // Send full history to repopulate the chart
        this.postFullHistory();
      }
    });
  }

  public postConfig() {
    if (!this.webviewView) { return; }
    const config = vscode.workspace.getConfiguration('sysmon');
    this.webviewView.webview.postMessage({
      config: {
        historySeconds: config.get<number>('historySeconds', 180),
        refreshRate: this.refreshRate,
        showMarkers: config.get<boolean>('showMarkers', false),
        smoothRate: config.get<number>('smoothRate', 1),
      }
    });
  }

  public postFullHistory() {
    if (!this.webviewView) { return; }
    this.webviewView.webview.postMessage({ data: this.samples });
  }

  public startPolling() {
    this.timer = setInterval(async () => {
      const base = await sampleCpuMem();
      const gpu = this.hasGpu ? await sampleNvidiaGpu() : null;
      const now = Date.now();
      const sample: Sample = {
        x: now,
        cpu: safeNum(base.cpu),
        mem: safeNum(base.mem),
        gpu: safeNum(gpu?.gpu),
        gpuMem: safeNum(gpu?.gpuMem)
      };
      this.samples.push(sample);
      // Trim old samples
      const cutoff = now - this.maxHistorySeconds * 1000;
      this.samples = this.samples.filter(s => s.x >= cutoff);
      // Post incremental sample
      if (this.webviewView) {
        this.webviewView.webview.postMessage({ data: sample });
      }
    }, 1000 * this.refreshRate);
  }

  public stopPolling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  dispose() {
    this.stopPolling();
  }
}

export async function activate(ctx: vscode.ExtensionContext) {
  const provider = new ResourceMonitorProvider(ctx);
  await provider.initialize(); // Await initialization here
  ctx.subscriptions.push(vscode.window.registerWebviewViewProvider('graphicalResourceMonitor', provider));

  const disposable = vscode.workspace.onDidChangeConfiguration(event => {
    const config = vscode.workspace.getConfiguration('sysmon');
    if (event.affectsConfiguration('sysmon.refreshRate')) {
      provider.refreshRate = config.get<number>('refreshRate', 1);
      provider.stopPolling();
      provider.startPolling();
      provider.postConfig();
    }else if (event.affectsConfiguration('sysmon')) {
      provider.postConfig(); // Send updated config to webview
    }
  });

  ctx.subscriptions.push(disposable);
  ctx.subscriptions.push({
    dispose: () => provider.dispose()
  });
}

export function deactivate() {}