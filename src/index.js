import express from "express";
import {router} from "./router/home.js";
import {config} from "dotenv";

config();

const app = express();
const PORT = process.env.PORT;

app.use('/', router);

app.listen(PORT, function() {
    console.log('server running: http://localhost:' + PORT);
});
