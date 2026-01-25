const fs = require('fs');
const { execSync } = require('child_process');
const { buildData, processDataUpdate } = require('../utils/json.js');

const FILE_PATH = process.env.FILE_PATH || './data/trackers.txt';
const DATA_CENTER_FILE = process.env.DATA_CENTER_FILE || './data.json';
const DATA_CENTER_NAME = process.env.DATA_CENTER_NAME || 'trackers';

const SOURCES = [
    "https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_all.txt",
    "https://raw.githubusercontent.com/XIU2/TrackersListCollection/refs/heads/master/all.txt",
    "https://newtrackon.com/api/all",
    "https://raw.githubusercontent.com/1265578519/OpenTracker/refs/heads/master/tracker.txt",
    "https://raw.githubusercontent.com/Tunglies/TrackersList/refs/heads/main/all.txt"
];

async function collectTrackers() {
    try {
        console.log("正在获取 Trackers...");
        if (!fs.existsSync('tmp_trackers')) fs.mkdirSync('tmp_trackers');

        for (const url of SOURCES) {
            try {
                const filename = require('crypto').createHash('md5').update(url).digest('hex') + '.txt';
                execSync(`curl -sSfL --retry 3 --connect-timeout 30 "${url}" -o "tmp_trackers/${filename}"`);
            } catch (e) {
                console.warn(`Failed to download ${url}`);
            }
        }

        // 合并并去重 (简化版验证, 仅提取格式)
        const combined = execSync(`find tmp_trackers -type f -name '*.txt' -exec cat {} + | grep -Eo '^(udp|tcp|http|ws)://[^/]+' | sort -u`).toString();
        const trackers = combined.split('\n').filter(t => t.trim().length > 0);

        // 这里原脚本有 nc 检测逻辑，但在 Node 中实现更复杂，暂保留核心合并逻辑
        // 或可调用 bash 脚本进行验证

        let content = trackers.join('\n');
        content += "\n\n# Sources:\n" + SOURCES.map(s => `# - ${s}`).join('\n');
        content += `\n\n# Last updated: ${new Date().toISOString()}`;
        content += `\n# Total trackers: ${trackers.length}`;

        fs.writeFileSync(FILE_PATH, content);
        console.log(`📄 Saved to ${FILE_PATH}`);

        const summaryData = buildData({
            name: DATA_CENTER_NAME,
            description: "BitTorrent Trackers List",
            description_zh: "BitTorrent 追踪器列表",
            path: [FILE_PATH.replace('./', '')]
        });

        processDataUpdate(DATA_CENTER_FILE, summaryData);

        // 清理
        execSync('rm -rf tmp_trackers');

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

collectTrackers();
