# daily-data-collector


## 数据展示

| 名称             | 描述                                       | 文件路径                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| runner-images    | GitHub Actions Runner 操作系统版本信息      | [runner-images.json](https://github.com/ACG-Q/daily-data-collector/blob/main/runner-images.json)                                                                                                                                                                                                                                                                                                                                                                                                   |
| actions-versions | GitHub Actions 版本信息                     | [actions-versions.json](https://github.com/ACG-Q/daily-data-collector/blob/main/actions-versions.json)                                                                                                                                                                                                                                                                                                                                                                                             |
| holidays         | 中国节假日信息                             | [holidays/holidays_2007.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2007.json)<br>[holidays/holidays_2008.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2008.json)<br>[holidays/holidays_2009.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2009.json)<br>[holidays/holidays_2010.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2010.json)<br>[holidays/holidays_2011.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2011.json)<br>[holidays/holidays_2012.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2012.json)<br>[holidays/holidays_2013.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2013.json)<br>[holidays/holidays_2014.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2014.json)<br>[holidays/holidays_2015.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2015.json)<br>[holidays/holidays_2016.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2016.json)<br>[holidays/holidays_2017.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2017.json)<br>[holidays/holidays_2018.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2018.json)<br>[holidays/holidays_2019.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2019.json)<br>[holidays/holidays_2020.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2020.json)<br>[holidays/holidays_2021.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2021.json)<br>[holidays/holidays_2022.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2022.json)<br>[holidays/holidays_2023.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2023.json)<br>[holidays/holidays_2024.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2024.json)<br>[holidays/holidays_2025.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2025.json)<br>[holidays/holidays_2026.json](https://github.com/ACG-Q/daily-data-collector/blob/main/holidays/holidays_2026.json) |
| blackIPs         | 自动订阅黑名单IP地址，并按每1000条分割为多个文件，便于管理和使用。 | [blackip/blackip_1_1.txt](https://github.com/ACG-Q/daily-data-collector/blob/main/blackip/blackip_1_1.txt)<br>[blackip/blackip_1_2.txt](https://github.com/ACG-Q/daily-data-collector/blob/main/blackip/blackip_1_2.txt)<br>[blackip/blackip_1_3.txt](https://github.com/ACG-Q/daily-data-collector/blob/main/blackip/blackip_1_3.txt)<br>[blackip/blackip_1_4.txt](https://github.com/ACG-Q/daily-data-collector/blob/main/blackip/blackip_1_4.txt)<br>[blackip/blackip_1_5.txt](https://github.com/ACG-Q/daily-data-collector/blob/main/blackip/blackip_1_5.txt)<br>[blackip/blackip_1_6.txt](https://github.com/ACG-Q/daily-data-collector/blob/main/blackip/blackip_1_6.txt)<br>[blackip/blackip_1_7.txt](https://github.com/ACG-Q/daily-data-collector/blob/main/blackip/blackip_1_7.txt)<br>[blackip/blackip_1_8.txt](https://github.com/ACG-Q/daily-data-collector/blob/main/blackip/blackip_1_8.txt)                                                                                                                                                                                                                           | 

## Runner 操作系统版本信息

### 概述

涵盖 Windows、Ubuntu 和 macOS 的最新版本信息。

> [!NOTE]
>
> 数据来源于 GitHub 官方 API，通过 Github Action 定期自动更新，确保与官方同步。

### 数据结构

数据以 JSON 格式存储，结构如下：

```json
{
  "sources": "actions/runner-images", // 数据来源
  "labels": [ // 所有可用的 Runner 标签
    "macos-13",
    "macos-13-large",
    "macos-13-xlarge",
    "macos-14",
    "macos-14-large",
    "macos-14-xlarge",
    "macos-15",
    "macos-15-large",
    "macos-15-xlarge",
    "macos-latest",
    "macos-latest-large",
    "macos-latest-xlarge",
    "ubuntu-20.04",
    "ubuntu-22.04",
    "ubuntu-24.04",
    "ubuntu-latest",
    "windows-2019",
    "windows-2022",
    "windows-2025",
    "windows-latest"
  ],
  "categories": { // 按操作系统分类的详细信息
    "ubuntu": [
      {
        "image": "Ubuntu 24.04", // 镜像名称
        "yamlLabels": [ // 在 YAML 文件中使用的标签
          "ubuntu-latest",
          "ubuntu-24.04"
        ]
      },
      {
        "image": "Ubuntu 22.04",
        "yamlLabels": [
          "ubuntu-22.04"
        ]
      },
      {
        "image": "Ubuntu 20.04",
        "yamlLabels": [
          "ubuntu-20.04"
        ]
      }
    ],
    "windows": [
      // ...
    ],
    "macos": [
      // ...
    ],
    "other": [] // 其他操作系统（如有）
  },
  "updated": "2025-03-05T01:20:06.652Z" // 数据更新时间
}
```

### 数据说明

1. **`labels`**：所有可用的 Runner 标签，可直接用于 GitHub Actions 配置文件中的 `runs-on` 字段。
2. **`categories`**：按操作系统分类的详细信息，包含镜像名称和对应的 YAML 标签。
3. **`updated`**：数据最后更新时间，确保数据时效性。

### 使用建议

- 在 GitHub Actions 配置文件中，使用 `runs-on` 字段指定 Runner 版本，如：
  ```yaml
  runs-on: ubuntu-latest
  ```
- 如需特定版本，可直接使用对应的标签，如 `ubuntu-22.04` 或 `windows-2022`。
- 定期检查 `updated` 字段，确保使用最新数据。


## Actions 版本信息

### 概述

包括常用 Actions（如 `actions/checkout`、`actions/setup-node` 等）的最新版本和历史版本。

> [!NOTE]
>
> 数据来源于 GitHub 官方 API，通过 Github Action 定期自动更新，确保与官方同步。

### 数据结构

数据以 JSON 格式存储，结构如下：

```json
{
  "actions": [ // Actions 列表
    {
      "repo": "actions/checkout", // 仓库名称
      "latest": "v4.2.2", // 最新版本
      "major": "4", // 主版本号
      "description": "Action for checking out a repo", // 功能描述
      "status": "active", // 状态（active/deprecated）
      "releaseDate": "2024-10-23T14:46:00Z", // 发布日期
      "changelog": "## What's Changed...", // 更新日志
      "docsUrl": "https://github.com/actions/checkout" // 文档链接
    }
  ],
  "updated": "2025-03-05T00:43:38.478Z" // 数据更新时间
}
```

### 数据说明

1. **`latest`**：当前推荐的最新稳定版本。
2. **`major`**：主版本号，可用于判断是否需要进行重大升级。
3. **`status`**：Action 的状态，`active` 表示官方支持，`deprecated` 表示已弃用。
4. **`changelog`**：版本更新日志，包含修复的 Bug 和新功能。
5. **`docsUrl`**：官方文档链接，提供详细的使用说明。

### 使用建议

- 在 GitHub Actions 配置文件中，使用 `uses` 字段指定 Action 版本，如：
  ```yaml
  uses: actions/checkout@v4
  ```
- 如需特定版本，可直接使用完整版本号，如 `actions/checkout@v4.2.2`。
- 定期检查 `changelog`，了解最新功能和修复内容。
- 关注 `status` 字段，避免使用已弃用的版本。


## holidays 节假日

### 概述

本文档包含中国节假日安排信息，数据来源于中国政府网，通过Python脚本自动爬取并结合部分手动整理。

### 数据结构

数据以JSON格式存储，结构如下：

```json
[
  {
    "content": "", // 通知正文内容
    "link": "", // 原文链接
    "parsed_data": { // 解析后的节假日数据
      "节假日名称": {
        "dates": [ // 假期日期
          "YYYY-MM-DD HH:MM:SS",
          ...
        ],
        "work_days": [ // 调休工作日
          "YYYY-MM-DD HH:MM:SS",
          ...
        ]
      }
    },
    "publish_date": "YYYY-MM-DD HH:MM:SS", // 发布日期
    "title": "通知标题", // 如"国务院办公厅关于XXXX年部分节假日安排的通知"
    "year": YYYY // 年份
  }
]
```

### 数据说明

1. 部分年份可能存在多个通知文件，需根据`publish_date`选择最新版本
2. 数据来源权威可靠，来自中国政府网
3. 包含自动爬取和手动整理两部分数据

### 使用建议

- 可通过`year`字段筛选特定年份数据
- 使用`publish_date`确定最新版本
- 节假日数据包含假期日期和调休安排

## blackIPs 黑名单IP列表

### 概述

本服务提供IP黑名单订阅功能，目前主要集成USTC IP黑名单数据。

### 数据特点

1. 数据来源：[USTC IP Blacklist](https://blackip.ustc.edu.cn/)
2. 文件分割：每1000行一个文件
3. 分割原因：适配雷池WAF个人版的单名单1000行限制

### 使用说明

- 可直接订阅使用
- 多个文件需全部加载
- 定期更新以保证数据时效性

### 注意事项

- 多个文件需同时使用
- 注意与本地防火墙规则的兼容性