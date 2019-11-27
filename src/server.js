import fs from 'fs';
import chalk from 'chalk';
import express from 'express';
import cors from 'cors';
import http from 'http';
import https from 'https';
import bodyParser from 'body-parser';
import merge from 'deepmerge';
import moment from 'moment';

const app = express();
const router = express.Router();
const env = process.env.NODE_ENV || 'Development';
const generalSettings = require('./appsettings.json');
const envSettings = require(`./appsettings.${env}.json`);
const settings = merge(generalSettings, envSettings);

let server;
let protocol;
if (settings.ssl.enabled) {
    protocol = 'https';
    server = https.createServer(
        {
            key: fs.readFileSync(settings.ssl.key),
            cert: fs.readFileSync(settings.ssl.cert)
        },
        app
    );
} else {
    protocol = 'http';
    server = http.createServer(app);
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

server.listen(process.env.PORT || settings.port);
console.log(`Listening on ${protocol}://localhost:${settings.port}`);

// Setup routes
router
    .get('/test', async (req, res) => {
	res.send('/api/test successful');
    });
