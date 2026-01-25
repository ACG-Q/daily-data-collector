const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { buildData, processDataUpdate } = require('../utils/json.js');
const { listFiles } = require('../utils/utils.js');

const SOURCES = JSON.parse(process.env.SOURCES || '["https://blackip.ustc.edu.cn/list.php?txt"]');
const LINE_LIMIT = parseInt(process.env.LINE_LIMIT || '1000');
const OUTPUT_PATH = process.env.OUTPUT_PATH || './data/blackip';
const DATA_CENTER_FILE = process.env.DATA_CENTER_FILE || './data.json';
const DATA_CENTER_NAME = process.env.DATA_CENTER_NAME || 'blackIPs';

async function fetchBlackIPs(source) {
    try {
        const response = await axios.get(source);
        return response.data;
    } catch (error) {
        console.error(`❌ Error fetching ${source}:`, error.message);
        return null;
    }
}

function splitAndSaveBlackIPs(blackIPs, outputPath, sourceIndex) {
    if (!blackIPs) return;

    const lines = blackIPs.split("\n").filter(line => line.trim());
    if (lines.length === 0) return;

    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    // 清理旧文件 (可选，但建议保持干净)
    // fs.readdirSync(outputPath).forEach(file => fs.unlinkSync(path.join(outputPath, file)));

    for (let i = 0; i < lines.length; i += LINE_LIMIT) {
        const chunk = lines.slice(i, i + LINE_LIMIT).join("\n");
        const fileName = `blackip_${sourceIndex}_${Math.floor(i / LINE_LIMIT) + 1}.txt`;
        const filePath = path.join(outputPath, fileName);
        fs.writeFileSync(filePath, chunk, "utf8");
    }
}

(async () => {
    try {
        for (let i = 0; i < SOURCES.length; i++) {
            const source = SOURCES[i];
            console.log(`🔍 Processing BlackIP: ${source}`);
            const data = await fetchBlackIPs(source);
            splitAndSaveBlackIPs(data, OUTPUT_PATH, i + 1);
        }

        const relativeOutputPath = OUTPUT_PATH.replace(process.cwd() + path.sep, '').replace(/^\.[\\\/]/, '');
        const files = listFiles(relativeOutputPath).map(f => f.replace(/\\/g, '/'));

        const summaryData = buildData({
            name: DATA_CENTER_NAME,
            description: 'Automatically subscribe to blacklisted IP addresses and split them into multiple files (1000 entries per file) for easy management and usage.',
            description_zh: '自动订阅黑名单IP地址，并按每1000条分割为多个文件，便于管理和使用。',
            path: files
        });

        processDataUpdate(DATA_CENTER_FILE, summaryData);
        console.log(`📄 Saved BlackIP data and updated ${DATA_CENTER_FILE}`);

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
})();
