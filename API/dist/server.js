"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const utils_1 = __importDefault(require("./utils"));
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
axios_1.default.defaults.timeout = 30000;
axios_1.default.defaults.httpsAgent = new https_1.default.Agent({ keepAlive: true });
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const propertymaps_1 = __importDefault(require("./propertymaps"));
app.use(body_parser_1.default.urlencoded({ limit: '50mb' }));
app.use(body_parser_1.default.json({
    limit: '50mb',
    verify: (req, res, buf, encoding) => {
        req.rawBody = buf.toString(encoding);
    }
}));
app.use((0, cookie_session_1.default)({
    name: 'session',
    keys: ['cRfdsaERTUx', 'jgfhjcvb'],
    maxAge: 24 * 60 * 60 * 7 * 1000
}));
/*app.use((req, res, next) => {
    req.session.portalId = 2660272;
    req.session.subscriptionActive = true;
    next();
});*/
require('./cronjobs');
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
    if (req.session.portalId) {
        next();
    }
    else {
        // Redirect to log in
        res.redirect('/oauth');
    }
});
app.use('/', express_1.default.static(__dirname.replace('dist', '') + '/app'));
app.get('/', utils_1.default.asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.sendFile(__dirname.replace('dist', '') + '/app/index.html');
})));
const install = require('./routes/install');
app.use('/install', install);
const payment = require('./routes/payment');
app.use('/payment', payment);
const port = process.env.PORT || 5000;
app.listen(port);
// printProps();
function printProps() {
    propertymaps_1.default.PROPERTIES.sort((a, b) => {
        const aName = a.label.toLowerCase();
        const bName = b.label.toLowerCase();
        if (aName > bName) {
            return 1;
        }
        else if (aName < bName) {
            return -1;
        }
        return 0;
    });
    console.log('CONTACT');
    for (const prop of propertymaps_1.default.PROPERTIES) {
        if (prop.isContact) {
            console.log(prop.label);
        }
    }
    console.log();
    console.log('COMPANY');
    for (const prop of propertymaps_1.default.PROPERTIES) {
        if (prop.isCompany) {
            console.log(prop.label);
        }
    }
}
