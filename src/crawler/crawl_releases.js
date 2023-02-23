import {HTTP_RESPONSE} from "../../constants/index.js";
import {mdToHtml} from "./md-to-html.js";

import rp from "request-promise";
import axios from "axios";
import * as cheerio from "cheerio";

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

export async function crawl_releases(crawlURL) {
    let maxNumPage = await getMaxNumPage(crawlURL);

    let promises = [];
    for (let numPage = 1; numPage <= Math.ceil(maxNumPage / 30); ++numPage) {
        let linkApi = "https://api.github.com/repos/" + crawlURL.split("https://github.com/")[1] + "/releases?page=" + numPage.toString();
        // console.log(linkApi);
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
                            author: {
                                name: item?.author?.login,
                                url: item?.author?.html_url,
                                avt: item?.author?.avatar_url,
                            },
                            version: item?.tag_name,
                            version_url: item?.html_url,
                            created_at: item?.created_at,
                            published_at: item?.published_at,
                            // change_log: item?.body
                            change_log: item?.body === "" ? `<b>Không có Change log</b>` : mdToHtml(item?.body)
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

        promises = [];
        for (let i = 0; i < versionsData.length - 1; ++i) {
            let linkCompare = "https://api.github.com/repos/" + crawlURL.split("https://github.com/")[1] + "/compare/" + versionsData[i + 1].version + "..." + versionsData[i].version;
            // console.log(linkCompare);
            promises.push(new Promise(async (resolve, reject) => {
                const retData = await axios.get(linkCompare, {
                    headers: {
                        Authorization: `token ${TOKEN}`,
                        accept: 'application/vnd.github+json',
                    }
                })
                    .then(res => {
                        return {
                            ...versionsData[i],
                            id: i + 1,
                            total_commits: res?.data.total_commits,
                        };
                    });
                try {
                    resolve(retData);
                } catch (error) {
                    reject(error);
                }
            }));
        };
        return Promise.all(promises).then((retData) => {
            // console.log(retData);
            return retData;
        });
    });

};

// async function Test() {
//     const CRAWL_URL = "https://github.com/DMOJ/judge-server";
//     const ret = await crawl_releases(CRAWL_URL);
//     console.log(ret);
// }
//
// Test();