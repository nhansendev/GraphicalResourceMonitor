"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHtml = getHtml;
function getHtml() {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://unpkg.com/uplot/dist/uPlot.iife.min.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/uplot/dist/uPlot.min.css">
  <style>
    body { font-family: sans-serif; margin: 10px; }
    #chart { width: 100%; height: 300px; }
  </style>
</head>
<body>
  <div id="chart"></div>

  <script>
    let uplot;

    function init(data) {
      uplot = new uPlot({
        width: window.innerWidth - 20,
        height: 300,
        scales: { y: { range: [0, 100] }},
        series: [
          { label: 'Time' },
          { label: 'CPU %' },
          { label: 'Memory %' },
          { label: 'GPU %' }
        ]
      }, data, document.getElementById('chart'));
    }

    window.addEventListener('message', e => {
      const samples = e.data.data;

      const t = samples.map(s => s.timestamp / 1000);
      const cpu = samples.map(s => s.cpu);
      const mem = samples.map(s => s.mem);
      const gpu = samples.map(s => s.gpu ?? null);

      const data = [t, cpu, mem, gpu];

      if (!uplot) init(data);
      else uplot.setData(data);
    });
  </script>
</body>
</html>`;
}
//# sourceMappingURL=html.js.map