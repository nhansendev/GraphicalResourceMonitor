const vscode = acquireVsCodeApi();

makePlot();

document.getElementById('settingsButton')
  .addEventListener('click', () => {
    vscode.postMessage({ command: 'openSettings' });
  });

function handleConfigUpdate(event) {
  const cfg = event.data?.config;
  if (!cfg) {return;}

  if (cfg.historySeconds && cfg.historySeconds !== maxHistory) {
    maxHistory = cfg.historySeconds;
    buffer = buffer.filter(s => s.x >= -maxHistory-0.01);
  }

  if (cfg.refreshRate) {refreshRate = cfg.refreshRate;}

  if (cfg.smoothRate) {
    smoothRate = cfg.smoothRate;
    resetEMA();
  }

  if (typeof cfg.showMarkers === 'boolean') {
    remakeSeries(cfg.showMarkers);
  }
}

function handleIncomingData(s) {
  if (!s) {return;}

  buffer.forEach(p => p.x -= refreshRate);

  if (Array.isArray(s)) {
    resetEMA();
    buffer = s.map(sample => smoothSample({
      x:(sample.x-Date.now())/1000,
      cpu:safeNum(sample.cpu),
      mem:safeNum(sample.mem),
      gpu:safeNum(sample.gpu),
      gpuMem:safeNum(sample.gpuMem)
    }));
  } else {
    buffer.push(smoothSample({
      x:(s.x-Date.now())/1000,
      cpu:safeNum(s.cpu),
      mem:safeNum(s.mem),
      gpu:safeNum(s.gpu),
      gpuMem:safeNum(s.gpuMem)
    }));
  }

  buffer = buffer.filter(p => p.x >= -maxHistory-0.01);
  updatePlotData();
}

window.addEventListener('message', e => {
  try {
    handleConfigUpdate(e);
    handleIncomingData(e.data.data);
  } catch (err) {
    console.error("Message handler error:", err);
  }
});

vscode.postMessage({ command:'ready' });