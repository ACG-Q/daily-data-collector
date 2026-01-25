const fs = require('fs');
const axios = require('axios');
const { buildData, processDataUpdate } = require('../utils/json.js');

const JSON_FILE_PATH = process.env.JSON_FILE_PATH || './data/actions-versions.json';
const DATA_CENTER_FILE = process.env.DATA_CENTER_FILE || './data.json';
const DATA_CENTER_NAME = process.env.DATA_CENTER_NAME || 'actions-versions';
const GITHUB_REPOS = JSON.parse(process.env.GITHUB_REPOS || '["actions/checkout", "actions/setup-node", "actions/setup-python"]');

const headers = {
    Accept: "application/vnd.github.v3+json",
};

if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
}

const fetchApi = async (url) => {
    try {
        const response = await axios.get(url, { headers });
        const rateLimitRemaining = response.headers["x-ratelimit-remaining"];
        const rateLimitReset = response.headers["x-ratelimit-reset"];

        if (rateLimitRemaining === "0") {
            const waitTime = rateLimitReset * 1000 - Date.now();
            console.log(`⏳ Rate limit exceeded, waiting for ${Math.ceil(waitTime / 1000)}s...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime + 1000));
            return await fetchApi(url);
        }

        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 403) {
            const rateLimitReset = error.response.headers["x-ratelimit-reset"];
            const waitTime = rateLimitReset * 1000 - Date.now();
            console.log(`⏳ 403 Forbidden (likely rate limit), waiting for ${Math.ceil(waitTime / 1000)}s...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime + 1000));
            return await fetchApi(url);
        }
        throw error;
    }
};

async function fetchLatestTag(git_repo) {
    try {
        const url = `https://api.github.com/repos/${git_repo}`;
        const repoData = await fetchApi(url);

        const description = repoData.description;
        const archived = repoData.archived;
        const docsUrl = repoData.html_url;

        const releasesUrl = repoData.releases_url.replace("{/id}", "");
        const releasesResponse = await fetchApi(releasesUrl);

        if (releasesResponse.length === 0) {
            return {
                latest: "N/A",
                major: "N/A",
                status: archived ? "deprecated" : "active",
                description: description,
                releaseDate: "N/A",
                changelog: "N/A",
                docsUrl: docsUrl,
            };
        }

        const latestRelease = releasesResponse[0];
        const latestTag = latestRelease.tag_name;
        const releaseDate = latestRelease.published_at;
        const changelog = latestRelease.body || "No changelog provided";

        return {
            latest: latestTag,
            major: latestTag.replace(/^v/, "").split(".")[0],
            status: archived ? "deprecated" : "active",
            description: description,
            releaseDate: releaseDate,
            changelog: changelog,
            docsUrl: docsUrl,
        };
    } catch (error) {
        console.error(`❌ Error fetching ${git_repo}:`, error.message);
        return null;
    }
}

(async () => {
    try {
        let existingData = { actions: [], updated: "" };
        if (fs.existsSync(JSON_FILE_PATH)) {
            existingData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf8'));
        }

        const actions = existingData.actions || [];

        for (const repo of GITHUB_REPOS) {
            console.log(`🔍 Processing: ${repo}`);
            const result = await fetchLatestTag(repo);
            if (result) {
                const index = actions.findIndex(item => item.repo === repo);
                const newData = { repo, ...result };
                if (index === -1) {
                    actions.push(newData);
                } else {
                    actions[index] = newData;
                }
            }
        }

        const output = {
            actions,
            updated: new Date().toISOString()
        };

        fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(output, null, 2));
        console.log(`📄 Saved to ${JSON_FILE_PATH}`);

        const summaryData = buildData({
            name: DATA_CENTER_NAME,
            description: "GitHub Actions Versions",
            description_zh: "GitHub Actions 版本信息",
            path: [JSON_FILE_PATH.replace('./', '')]
        });

        processDataUpdate(DATA_CENTER_FILE, summaryData);

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
})();
