import fs from 'fs';
import chalk from 'chalk';
import express from 'express';
import cors from 'cors';
import http from 'http';
import https from 'https';
import bodyParser from 'body-parser';
import merge from 'deepmerge';
import moment from 'moment';
import axios from 'axios';

const app = express();
const router = express.Router();
let httpServer = http.createServer(app);
app.use(bodyParser.urlencoded({ extended: true }))
    .use(
        cors({
            origin: process.env.ORIGINS || '*'
        })
    )
    .use(bodyParser.json())
    .use('/api', router)
    .get('/', (req, res) => {
        const pkg = require('../package.json');
        res.send(`<h1>${pkg.name}</h1>
        <h2>Version: ${pkg.version}</h2>`);
    });

const port = process.env.NODE_PORT || 3001;
httpServer.listen(port);
console.log(`Listening on http://localhost:${port}`);

// Setup routes
router.get('/test', async (req, res) => {
    try {
        const intHost = process.env.NODE_TEMPLATE_SERVICE_HOST || 'localhost';
        const intPort = process.env.NODE_TEMPLATE_SERVICE_PORT || 3000;
        const intResult = await axios.get(`http://${intHost}:${intPort}/api/test`);
        res.send(`test endpoint successful and ${intResult.data}`);
    } catch (err) {
        console.err(err);
        res.sendStatus(500);
    }
});
