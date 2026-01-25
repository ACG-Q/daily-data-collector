const fs = require("fs");
const path = require("path");

/**
 * 列出指定文件夹的所有文件（递归）
 * @param {string} dir - 文件夹路径
 * @returns {string[]} - 包含所有文件路径的数组
 */
const listFiles = (dir) => {
    try {
        const files = fs.readdirSync(dir);
        const result = [];

        for (const file of files) {
            const filePath = path.join(dir, file);

            // 获取文件状态
            let stats;
            try {
                stats = fs.statSync(filePath);
            } catch (err) {
                // 忽略无法访问的文件或符号链接
                console.warn(`无法访问文件: ${filePath}`, err.message);
                continue;
            }

            // 如果是目录，递归处理
            if (stats.isDirectory()) {
                result.push(...listFiles(filePath));
            } else if (stats.isFile()) {
                result.push(filePath);
            }
        }

        return result;
    } catch (err) {
        // 捕获并处理读取目录时的错误
        console.error(`无法读取目录: ${dir}`, err.message);
        return [];
    }
};

module.exports = { listFiles };