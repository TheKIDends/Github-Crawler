import express from "express"
import {crawl_releases} from "../crawler/crawl_releases.js";
import {crawl_commits} from "../crawler/crawl_commits.js";

export const router = express.Router()

router.get('/', (req, res) => {
    res.render('home.ejs')
})

router.get('/releases',  async (req, res) => {
    // console.log(req.query.githubRepo);
    const releasesInfoList = await crawl_releases(req.query.githubRepo.trim());
    res.render('releases.ejs', {
        github_repo: req.query.githubRepo.trim(),
        data: releasesInfoList
    });
});

router.get("/commits_detail", async (req, res) => {
    const githubRepo = req.query.githubRepo.trim();
    const index = Number.parseInt(req.query.index);
    // console.log(githubRepo, index);
    const commitsList = await crawl_commits(githubRepo, index);
    res.render('commits_detail.ejs', {data: commitsList});
});
