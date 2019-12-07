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
const env = process.env.NODE_ENV || 'Development';
const generalSettings = require('./appsettings.json');
const envSettings = require(`./appsettings.${env}.json`);
const settings = merge(generalSettings, envSettings);

let httpServer;
let httpsServer;
if ((settings.server.http || {}).enabled) {
    httpServer = http.createServer(app);
}
if ((settings.server.https || {}).enabled) {
    httpsServer = https.createServer(
        {
            key: fs.readFileSync(settings.server.https.key),
            cert: fs.readFileSync(settings.server.https.cert)
        },
        app
    );
}

app.use(bodyParser.urlencoded({ extended: true }))
    .use(
        cors({
            origin: settings.allowedOrigin
        })
    )
    .use(bodyParser.json())
    .use('/api', router)
    .get('/', (req, res) => {
        const pkg = require('../package.json');
        res.send(`<h1>${pkg.name}</h1>
        <h2>Version: ${pkg.version}</h2>`);
    });

if (httpServer) {
    httpServer.listen(settings.server.http.port);
    console.log(`Listening on http://localhost:${settings.server.http.port}`);
}
if (httpsServer) {
    httpsServer.listen(settings.server.https.port);
    console.log(`Listening on https://localhost:${settings.server.https.port}`);
}

// Setup routes
router.get('/test', async (req, res) => {
    try {
        const nodeTemplateUrl =
            (settings.services || {}).nodeTemplate ||
            `http://${process.env.NODE_TEMPLATE_SERVICE_HOST}:${process.env.NODE_TEMPLATE_SERVICE_PORT}`;
        const nodeTemplateRes = await axios.get(`${nodeTemplateUrl}/api/test`);
        res.send(`test endpoint successful and ${nodeTemplateRes.data}`);
    } catch (err) {
        console.err(err);
        res.sendStatus(500);
    }
});
