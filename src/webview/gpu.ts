import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
let hasNvidiaCache: boolean | null = null;

export async function hasNvidiaGpu(): Promise<boolean> {
  if (hasNvidiaCache !== null) {return hasNvidiaCache;}

  try {
    await execAsync('nvidia-smi -L');
    hasNvidiaCache = true;
  } catch {
    hasNvidiaCache = false;
  }

  return hasNvidiaCache;
}

export async function sampleNvidiaGpu() {
  try {
    const { stdout } = await execAsync(
      'nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits'
    );

    const [util, used, total] =
      stdout.trim().split(',').map(Number);

    return {
        gpu: Number.isFinite(util) ? util : null,
        gpuMem: Number.isFinite(total) && total > 0
            ? 100 * used / total
            : null
    };

  } catch {
    return null;
  }
}
