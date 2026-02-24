import express from 'express';
import cors from 'cors';
import Utils from './utils';
import axios from 'axios';
import https from 'https';
axios.defaults.timeout = 30000;
axios.defaults.httpsAgent = new https.Agent({keepAlive: true});
const app = express();
app.use(cors());
import bodyParser from "body-parser";
import cookieSession from 'cookie-session';
import PropertyMaps from './propertymaps';
app.use(bodyParser.urlencoded({limit: '50mb'}));
app.use(bodyParser.json({
    limit: '50mb',
    verify: (req, res, buf, encoding) => {
        (req as any).rawBody = (buf as any).toString(encoding);
    }
}));

app.use(cookieSession({
    name: 'session',
    keys: ['cRfdsaERTUx', 'jgfhjcvb'],
    maxAge: 24 * 60 * 60 * 7 * 1000
}));

/*app.use((req, res, next) => {
    req.session.portalId = 2660272;
    req.session.subscriptionActive = true;
    next();
});*/

require('./cronjobs')

// Allow OAuth routes before session check
const oauth = require('./routes/oauth');
app.use('/oauth', oauth);

const hsWebHook = require('./routes/hswebhook');
app.use('/hswebhook', hsWebHook);

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/oauth');
});

// Check valid session
app.use((req, res, next) => {
    if(req.session.portalId) {
        next();
    } else {
        // Redirect to log in
        res.redirect('/oauth');
    }
});

app.use('/', express.static(__dirname.replace('dist', '') + '/app'));
app.get('/', Utils.asyncHandler(async (req, res) => {
    res.sendFile(__dirname.replace('dist', '') + '/app/index.html');
}));

const install = require('./routes/install');
app.use('/install', install);
const payment = require('./routes/payment');
app.use('/payment', payment);

const port = process.env.PORT || 5000;
app.listen(port);

// printProps();
function printProps() {
    PropertyMaps.PROPERTIES.sort((a, b) => {
        const aName = a.label.toLowerCase();
        const bName = b.label.toLowerCase();
        if(aName > bName) {
            return 1
        } else if(aName < bName) {
            return -1
        }
        return 0
    })

    console.log('CONTACT');
    for(const prop of PropertyMaps.PROPERTIES) {
        if(prop.isContact) {
            console.log(prop.label);
        }
    }
    console.log();
    console.log('COMPANY');
    for(const prop of PropertyMaps.PROPERTIES) {
        if(prop.isCompany) {
            console.log(prop.label);
        }
    }
}