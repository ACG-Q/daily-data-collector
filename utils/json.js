const fs = require("fs");

/**
 * @typedef {Object} DataItem
 * @property {string} name - 名称
 * @property {string} description - 描述
 * @property {string} [description_zh] - 中文描述
 * @property {string[]} path - 路径
 * @property {string} [updated] - 更新时间 - ISO格式时间戳(2021-10-01T00:00:00.000Z)
 */

/**
 * @typedef {Object} JsonData
 * @property {DataItem[]} data - 数据列表
 */

/**
 * 获取当前时间戳
 * @returns {string} ISO格式时间戳
 */
const getCurrentTimestamp = () => new Date().toISOString();

/**
 * 构建特定data格式
 * @param {DataItem} data - 名称
 * @returns {DataItem} 构建后的数据项
 */
const buildData = (data) => {
    const { name, description, description_zh, path, updated } = data;
    return {
        name,
        description,
        description_zh,
        path,
        updated: updated || getCurrentTimestamp(),
    };
};

/**
 * 读取 JSON 文件
 * @param {string} path - 文件路径
 * @returns {JsonData} 解析后的JSON数据
 */
const readJson = (path) => {
    try {
        const data = fs.readFileSync(path, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件 ${path} 失败：${error.message}`);
        return { data: [] }; // 返回空数据以避免中断流程
    }
};

/**
 * 写入 JSON 文件
 * @param {string} path - 文件路径
 * @param {DataItem[]} data - 要写入的数据
 * @throws {Error} 写入失败时抛出异常
 */
const writeJson = (path, data) => {
    try {
        fs.writeFileSync(path, JSON.stringify({ data }, null, 2), "utf8");
        console.log(`写入文件 ${path} 成功`);
    } catch (error) {
        console.error(`写入文件 ${path} 失败：${error.message}`);
        throw error; // 抛出异常以便上层处理
    }
};

/**
 * 更新 JSON 数据
 * @param {DataItem[]} oldData - 原始数据
 * @param {DataItem} newData - 新数据
 * @returns {DataItem[]} 更新后的数据
 */
const updateJson = (oldData, newData) => {
    const index = oldData.findIndex((item) => item.name === newData.name);
    if (index === -1) {
        return [...oldData, buildData(newData)]; // 新增数据
    }

    // 更新现有数据
    return [
        ...oldData.slice(0, index),
        buildData({ ...oldData[index], ...newData, updated: getCurrentTimestamp() }),
        ...oldData.slice(index + 1),
    ];
};

/**
 * 主处理函数
 * @param {string} filePath - 目标文件路径
 * @param {DataItem} newData - 新数据
 */
const processDataUpdate = (filePath, newData) => {
    const { data: existingData } = readJson(filePath);
    const updatedData = updateJson(existingData, newData);
    writeJson(filePath, updatedData);
};

module.exports = {
    processDataUpdate,
    buildData,
    getCurrentTimestamp,
    readJson,
    writeJson,
    updateJson,
};