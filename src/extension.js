"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const monitor_1 = require("./monitor");
const gpu_1 = require("./gpu");
const panel_1 = require("./panel");
const html_1 = require("./html");
async function activate(ctx) {
    const panel = new panel_1.MonitorPanel((0, html_1.getHtml)());
    const hasGpu = await (0, gpu_1.hasNvidiaGpu)();
    const buffer = [];
    const MAX_POINTS = 300;
    const timer = setInterval(async () => {
        const base = await (0, monitor_1.sampleCpuMem)();
        const gpu = hasGpu ? await (0, gpu_1.sampleNvidiaGpu)() : null;
        buffer.push({
            timestamp: Date.now(),
            ...base,
            ...gpu
        });
        if (buffer.length > MAX_POINTS) {
            buffer.shift();
        }
        panel.update(buffer);
    }, 1000);
    panel.dispose(() => clearInterval(timer));
}
//# sourceMappingURL=extension.js.map