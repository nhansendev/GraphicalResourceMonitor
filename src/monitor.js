"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleCpuMem = sampleCpuMem;
const systeminformation_1 = __importDefault(require("systeminformation"));
async function sampleCpuMem() {
    const [cpu, mem] = await Promise.all([
        systeminformation_1.default.currentLoad(),
        systeminformation_1.default.mem()
    ]);
    return {
        cpu: cpu.currentLoad,
        mem: 100 * mem.used / mem.total
    };
}
const MAX_POINTS = 300; // 5 minutes @ 1Hz
const buffer = [];
function pushSample(s) {
    buffer.push(s);
    if (buffer.length > MAX_POINTS) {
        buffer.shift();
    }
}
//# sourceMappingURL=monitor.js.map