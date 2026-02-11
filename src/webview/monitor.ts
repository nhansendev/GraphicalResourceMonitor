import si from 'systeminformation';

export interface Sample {
  timestamp: number;
  cpu: number;
  mem: number;
  gpu?: number;
  gpuMem?: number;
}

export async function sampleCpuMem(): Promise<Pick<Sample, 'cpu' | 'mem'>> {
  const [cpu, mem] = await Promise.all([
    si.currentLoad(),
    si.mem()
  ]);

  return {
    cpu: cpu.currentLoad,
    mem: 100 * mem.used / mem.total
  };
}
