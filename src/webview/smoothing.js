let emaValues = { cpu: null, mem: null, gpu: null, gpuMem: null };

function resetEMA() {
  emaValues = { cpu: null, mem: null, gpu: null, gpuMem: null };
}

function applyEMA(name, value) {
  if (value === null) {return null;}
  if (smoothRate === 1) {return value;}

  if (emaValues[name] === null) {
    emaValues[name] = value;
    return value;
  }

  const prev = emaValues[name];
  const next = value * smoothRate + prev * (1 - smoothRate);
  emaValues[name] = next;
  return next;
}

function smoothSample(sample) {
  return {
    x: sample.x,
    cpu: applyEMA('cpu', sample.cpu),
    mem: applyEMA('mem', sample.mem),
    gpu: applyEMA('gpu', sample.gpu),
    gpuMem: applyEMA('gpuMem', sample.gpuMem),
  };
}