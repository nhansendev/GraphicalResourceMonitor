"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasNvidiaGpu = hasNvidiaGpu;
exports.sampleNvidiaGpu = sampleNvidiaGpu;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let hasNvidiaCache = null;
async function hasNvidiaGpu() {
    if (hasNvidiaCache !== null) {
        return hasNvidiaCache;
    }
    try {
        await execAsync('nvidia-smi -L');
        hasNvidiaCache = true;
    }
    catch {
        hasNvidiaCache = false;
    }
    return hasNvidiaCache;
}
async function sampleNvidiaGpu() {
    try {
        const { stdout } = await execAsync('nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits');
        const [util, used, total] = stdout.trim().split(',').map(Number);
        return {
            gpu: util,
            gpuMem: 100 * used / total
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=gpu.js.map