const colors = ['#ff4d4d','#4da6ff','#33cc33','#ffff00'];

let uplot;

function buildSeries(showPoints=false) {
  const s = [{}];
  for (let i=0;i<colors.length;i++) {
    s.push({
      stroke: colors[i],
      width: 1,
      points: { show: showPoints, size: 3 }
    });
  }
  return s;
}

function makePlot() {
  const empty = [[],[],[],[],[]];

  uplot = new uPlot({
    width: window.innerWidth,
    height: window.innerHeight,
    legend:{show:false},

    scales:{
      x:{ time:false, range:()=>[-maxHistory,0], space:30 },
      y:{ range:[0,100] }
    },

    axes:[
      {
        stroke:'#aaa',
        grid:{stroke:'#444',width:1},
        values:(u,vals)=>vals.map(v=>{
          const r = Math.floor(Math.abs(v)/5)*5;
          const m = Math.floor(r/60);
          const s = r%60;
          return '-' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        })
      },
      {
        stroke:'#aaa',
        grid:{stroke:'#444',width:1},
        values:(u,vals)=>vals.map(v=>v+'%')
      }
    ],

    series: buildSeries(false),

    cursor:{show:false,lock:false,focus:{prox:0}},

    hooks:{
      draw:[drawOverlayText]
    }

  }, empty, document.getElementById('chart'));
}

function drawOverlayText(u) {
  const ctx=u.ctx;
  ctx.save();
  ctx.font='12px sans-serif';
  ctx.textAlign='left';
  ctx.textBaseline='top';

  const last=u.data[0].length-1;
  if(last<0) {return;}

  const labels=['CPU','RAM','GPU','VRAM'];

  for(let i=1;i<=labels.length;i++){
    const v=u.data[i][last];
    if(typeof v!=='number') {continue;}
    ctx.fillStyle=colors[i-1];
    ctx.fillText(labels[i-1]+': '+v.toFixed(1)+'%', 42, 14*i);
  }

  ctx.restore();
}

function updatePlotData() {
  if (!uplot) {return;
}
  const data = [
    buffer.map(p=>p.x),
    buffer.map(p=>p.cpu),
    buffer.map(p=>p.mem),
    buffer.map(p=>p.gpu),
    buffer.map(p=>p.gpuMem),
  ];

  uplot.setData(data);
}

function remakeSeries(show) {
  uplot.batch(()=>{
    for(let i=1;i<=colors.length;i++){
      uplot.delSeries(i);
      uplot.addSeries({
        stroke:colors[i-1],
        width:1,
        points:{show,size:3}
      }, i);
    }
  });
}

function updatePlotSize() {
  if (!uplot) {return;}
  uplot.setSize({
    width: window.innerWidth-20,
    height: window.innerHeight
  });
}

window.addEventListener('resize', updatePlotSize);