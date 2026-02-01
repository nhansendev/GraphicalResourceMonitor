import * as vscode from 'vscode';
import { sampleCpuMem } from './monitor';
import { hasNvidiaGpu, sampleNvidiaGpu } from './gpu';
import { getHtml } from './html';

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
  private pollingStarted: boolean = false;

  // Remove async call from constructor
  constructor() {}

  async initialize() {
    this.hasGpu = await hasNvidiaGpu();
    const config = vscode.workspace.getConfiguration('sysmon');
    this.refreshRate = config.get<number>('refreshRate', 1);
    this.maxHistorySeconds = config.get<number>('historySeconds', 180);
    // Do not start polling here; wait for webview ready
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.webviewView = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = getHtml();
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
        showMarkers: config.get<boolean>('showMarkers', false)
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
  const provider = new ResourceMonitorProvider();
  await provider.initialize(); // Await initialization here
  ctx.subscriptions.push(vscode.window.registerWebviewViewProvider('graphicalResourceMonitor', provider));

  const disposable = vscode.workspace.onDidChangeConfiguration(event => {
    const config = vscode.workspace.getConfiguration('sysmon');
    if (event.affectsConfiguration('sysmon.refreshRate')) {
      provider.refreshRate = config.get<number>('refreshRate', 1);
      provider.stopPolling();
      provider.startPolling();
      provider.postConfig();
    }
    if (event.affectsConfiguration('sysmon.historySeconds') || event.affectsConfiguration('sysmon.showMarkers')) {
      provider.postConfig(); // Send updated config to webview
    }
  });

  ctx.subscriptions.push(disposable);
  ctx.subscriptions.push({
    dispose: () => provider.dispose()
  });
}

export function deactivate() {}