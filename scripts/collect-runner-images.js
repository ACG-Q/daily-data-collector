const fs = require('fs');
const axios = require('axios');
const { buildData, processDataUpdate } = require('../utils/json.js');

const GITHUB_REPO = process.env.GITHUB_REPO || 'actions/runner-images';
const JSON_FILE_PATH = process.env.JSON_FILE_PATH || './data/runner-images.json';
const DATA_CENTER_FILE = process.env.DATA_CENTER_FILE || './data.json';
const DATA_CENTER_NAME = process.env.DATA_CENTER_NAME || 'runner-images';

// 获取 README.md 内容
async function fetchReadme() {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/README.md`;
    const response = await axios.get(url, {
        headers: { 'Accept': 'application/vnd.github.v3.raw' }
    });
    return response.data;
}

// 解析 YAML 标签
function parseYamlLabel(yamlLabel) {
    return yamlLabel
        .split(' or ')
        .map(label => label.split(','))
        .flat()
        .map(label => label.trim())
        .map(label => label.replace(/`/g, ''))
        .filter(label => label.length > 0);
}

// 解析 OS 版本
function parseOSVersions(content) {
    // 找到table的开始和结束位置
    const tableStart = content.indexOf('| Image | Architecture | YAML Label | Included Software |');
    const tableEnd = content.indexOf('\n\n', tableStart);
    const tableContent = content.slice(tableStart, tableEnd);

    // 解析 table 内容
    const lines = tableContent.split('\n').filter(line => line.trim().startsWith('|'));

    const headers = lines[0]
        .split('|')
        .slice(1, -1)
        .map(header => header.trim());

    // 解析每一行
    const data = lines.slice(2).map(line => {
        const cells = line
            .split('|')
            .slice(1, -1)
            .map(cell => cell.trim());

        return headers.reduce((obj, header, index) => {
            obj[header] = cells[index];
            return obj;
        }, {});
    });

    // 分类
    const categories = {
        ubuntu: [],
        windows: [],
        macos: [],
        other: []
    };

    // 标签
    const labels = [];

    data.forEach(item => {
        const image = item.Image
            .replace(/<sup>.*?<\/sup>/g, '') // 去掉 <sup> 标签
            .replace(/<br>/g, ' ')           // 将 <br> 替换为空格
            .replace(/!\[.*?\]\(.*?\)/g, '') // 去掉 Markdown 图片/徽章
            .trim();
        const yamlLabel = item['YAML Label'].replace(/`/g, '').trim();
        const yamlLabels = parseYamlLabel(yamlLabel);

        const entry = { image, yamlLabels };
        labels.push(...yamlLabels);

        if (image.includes('Ubuntu')) {
            categories.ubuntu.push(entry);
        } else if (image.includes('Windows')) {
            categories.windows.push(entry);
        } else if (image.includes('macOS')) {
            categories.macos.push(entry);
        } else {
            categories.other.push(entry);
        }
    });

    return {
        sources: GITHUB_REPO,
        labels: [...new Set(labels)].sort(),
        categories,
        updated: new Date().toISOString()
    };
}

(async () => {
    try {
        console.log(`正在从 ${GITHUB_REPO} 获取数据...`);
        const readmeContent = await fetchReadme();

        // 如果是 base64 编码的（通常由 GitHub API 返回），则解码
        let decodedContent = readmeContent;
        if (typeof readmeContent === 'string' && !readmeContent.includes('|')) {
            try {
                decodedContent = Buffer.from(readmeContent, 'base64').toString('utf8');
            } catch (e) {
                // 可能本身就是 markdown
            }
        }

        const data = parseOSVersions(decodedContent);

        // 将数据写入 JSON 文件
        fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(data, null, 2));
        console.log(`JSON 文件已生成：${JSON_FILE_PATH}`);

        // 更新数据中心文件
        const summaryData = buildData({
            name: DATA_CENTER_NAME,
            description: "GitHub Actions Runner OS Versions",
            description_zh: "GitHub Actions Runner 操作系统版本",
            path: [JSON_FILE_PATH.replace('./', '')]
        });

        processDataUpdate(DATA_CENTER_FILE, summaryData);
        console.log(`数据中心文件已更新：${DATA_CENTER_FILE}`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();
