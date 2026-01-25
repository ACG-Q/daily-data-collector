const { execSync } = require('child_process');
const path = require('path');
const { buildData, processDataUpdate } = require('../utils/json.js');
const { listFiles } = require('../utils/utils.js');

const OUTPUT_PATH = process.env.OUTPUT_PATH || path.resolve(__dirname, '../data/holidays/');
const DATA_CENTER_FILE = process.env.DATA_CENTER_FILE || path.resolve(__dirname, '../data.json');
const DATA_CENTER_NAME = process.env.DATA_CENTER_NAME || 'holidays';

async function collectHolidays() {
    try {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;

        console.log(`🔍 Fetching holidays for ${currentYear} and ${nextYear}...`);

        const pythonScript = path.resolve(__dirname, 'holidays/holidays.py');
        const requirementsFile = path.resolve(__dirname, 'holidays/requirements.txt');

        // 尝试安装依赖 (可选)
        // execSync(`pip install -r "${requirementsFile}"`, { stdio: 'inherit' });

        execSync(`python "${pythonScript}" -y ${currentYear} ${nextYear} -o "${OUTPUT_PATH}"`, { stdio: 'inherit' });

        const relativeOutputPath = path.relative(path.resolve(__dirname, '..'), OUTPUT_PATH).replace(/\\/g, '/');
        const files = listFiles(relativeOutputPath).map(f => f.replace(/\\/g, '/'));

        const data = buildData({
            name: DATA_CENTER_NAME,
            description: 'Chinese Holiday Information',
            description_zh: '中国节假日信息',
            path: files
        });

        processDataUpdate(DATA_CENTER_FILE, data);
        console.log(`📄 Saved Holidays data and updated ${DATA_CENTER_FILE}`);

    } catch (error) {
        console.error("❌ Error collecting holidays:", error.message);
        // 如果没有 python 或失败，不中断整体流程
    }
}

collectHolidays();
