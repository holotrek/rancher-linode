import express from 'express';
import cors from 'cors';
import http from 'http';
import bodyParser from 'body-parser';
import axios from 'axios';
import githubOAuth from 'github-oauth';

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    console.error('GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables required');
    process.exit(1);
}
const getOAuth = req => {
    const oauth = githubOAuth({
        githubClient: process.env.GITHUB_CLIENT_ID,
        githubSecret: process.env.GITHUB_CLIENT_SECRET,
        baseURL: `${req.protocol}://${req.hostname}:${req.socket.localPort}`,
        loginURI: '/auth/github',
        callbackURI: '/auth/github/callback'
    });
    oauth.on('error', function(err) {
        console.error('Login error:', err);
    });
    oauth.on('token', function(token, serverResponse) {
        serverResponse.end(JSON.stringify(token));
    });
    return oauth;
};

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
    })
    .get('/auth', (req, res) => {
        res.send(
            `<h1>Login</h1><h2>Click below to login with GitHub Auth</h2><a href="${req.protocol}://${req.hostname}:${req.socket.localPort}/auth/github">Login with GitHub</a>`
        );
    })
    .get('/auth/github', async (req, res) => {
        console.log('started oauth');
        return getOAuth(req).login(req, res);
    })
    .get('/auth/github/callback', async (req, res) => {
        console.log('received callback');
        return getOAuth(req).callback(req, res);
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
        console.error(err);
        res.sendStatus(500);
    }
});
