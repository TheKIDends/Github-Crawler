import {HTTP_RESPONSE} from "../../constants/index.js";

import rp from "request-promise";
import axios from "axios";
import * as cheerio from "cheerio";
import markdown from "markdown";

const TOKEN = "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";

async function getMaxNumPage(crawlURL) {
    let maxNumPage = -1;
    await rp(crawlURL, async (error, response, html) => {
        if(!error && response.statusCode === HTTP_RESPONSE.SUCCESS) {
            const $ = cheerio.load(html); // load HTML
            $('.BorderGrid-cell .Counter').each((index, el) => {
                if (maxNumPage === -1) {
                    maxNumPage = parseInt($(el).text());
                }
            });
        }
        else {
            return error;
        }
    });
    return maxNumPage;
}

export async function crawl_commits(crawlURL, index) {
    let maxNumPage = await getMaxNumPage(crawlURL);

    let promises = [];
    for (let numPage = 1; numPage <= Math.ceil(maxNumPage / 30); ++numPage) {
        let linkApi = "https://api.github.com/repos/" + crawlURL.split("https://github.com/")[1] + "/releases?page=" + numPage.toString();
        promises.push(new Promise( async (resolve, reject) => {
            try {
                let versionData = await axios.get(linkApi, {
                    headers: {
                        Authorization: `token ${TOKEN}`,
                        accept: 'application/vnd.github+json',
                    }
                })
                    .then(res => {
                        const data = res?.data;
                        return data.map(item => ({
                            version: item?.tag_name
                        }));
                    });
                resolve(versionData);
            } catch (error) {
                reject(error);
            }
        }));
    };

    let versionsData = [];
    return Promise.all(promises).then(async (data) => {
        for (let i in data) {
            versionsData = versionsData.concat(data[i]);
        }
        // console.log(versionsData);

        let linkCompare = "https://api.github.com/repos/" + crawlURL.split("https://github.com/")[1] + "/compare/" + versionsData[index + 1].version + "..." + versionsData[index].version;
        // console.log(linkCompare);
        return await axios.get(linkCompare, {
            headers: {
                Authorization: `token ${TOKEN}`,
                accept: 'application/vnd.github+json',
            }
        })
            .then(res => {
                let commitsData = res?.data.commits;
                return commitsData.map(item => ({
                    committer: {
                        name: item?.committer?.login,
                        url: item?.committer?.url,
                        avt: item?.committer?.avatar_url
                    },
                    hash_code: {
                        code: item?.sha,
                        url: item?.html_url,
                    },
                    comment: item?.commit?.message,
                    date: item?.commit?.committer?.date
                }));
            });
    });
};

// async function Test() {
//     const CRAWL_URL = "https://github.com/DMOJ/judge-server";
//     const ret = await crawl_commits(CRAWL_URL, 1);
//     console.log(ret);
//
// }
//
// Test();