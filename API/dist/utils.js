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
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const mssql_1 = __importDefault(require("mssql"));
class Utils {
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    static getHSHeaders(accessToken) {
        return {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };
    }
    static getHSAccessToken(hsPortalId, forceRefresh, isActiveCheck) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            Utils.DB_POOL
                .then((pool) => __awaiter(this, void 0, void 0, function* () {
                let isActiveQuery = '';
                if (isActiveCheck) {
                    isActiveQuery = 'AND IsActive = 1';
                }
                let result;
                try {
                    result = yield new mssql_1.default.Request(pool)
                        .input('HSPortalId', mssql_1.default.Int, hsPortalId)
                        .query(`SELECT TOP(1) * FROM tblPortalTokens WHERE HSPortalId = @HSPortalId ${isActiveQuery}`);
                }
                catch (e) {
                    reject("ERROR");
                    return;
                }
                if (result.recordset[0]) {
                    let tokens = result.recordset[0];
                    if (tokens.Expires < (+new Date()) || forceRefresh) {
                        console.log("REFRESH");
                        const refreshQuery = `grant_type=refresh_token&client_id=${Utils.HS_CLIENT_ID}&client_secret=${Utils.HS_CLIENT_SECRET}&refresh_token=${tokens.RefreshToken}`;
                        let newTokens;
                        yield axios_1.default.post('https://api.hubapi.com/oauth/v1/token', refreshQuery)
                            .then(resp => {
                            newTokens = resp === null || resp === void 0 ? void 0 : resp.data;
                        })
                            .catch(e => {
                            var _a, _b;
                            reject((_b = (_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.status);
                        });
                        if (!newTokens) {
                            return;
                        }
                        let accessToken = newTokens.access_token, refreshToken = newTokens.refresh_token, expiresIn = newTokens.expires_in;
                        let expiresTimestamp = ((+new Date()) + (expiresIn * 1000) - 300000); // -5 min to be safe
                        new mssql_1.default.Request(pool)
                            .input('HSPortalId', hsPortalId)
                            .input('RefreshToken', refreshToken)
                            .input('AccessToken', Utils.encrypt(accessToken))
                            .input('Expires', expiresTimestamp)
                            .execute('prcAddTokens')
                            .catch(e => {
                            console.log(e);
                        });
                        resolve(accessToken);
                    }
                    else {
                        resolve(Utils.decrypt(tokens.AccessToken));
                    }
                }
                else {
                    reject("NOT FOUND");
                }
            }));
        }));
    }
    static request(method, url, headers, isHubspot, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let retries = 0;
                while (true) {
                    let burstRetry = false;
                    let error;
                    if (data) {
                        yield axios_1.default[method](url, data, { headers: headers })
                            .then(resp => {
                            resolve(resp);
                        })
                            .catch(e => {
                            var _a, _b, _c;
                            if (((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.status) == 429) {
                                if (isHubspot && ((_c = (_b = e === null || e === void 0 ? void 0 : e.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.policyName) == 'SECONDLY') {
                                    burstRetry = true;
                                }
                                else {
                                    burstRetry = true;
                                }
                            }
                            else {
                                error = e;
                            }
                        });
                    }
                    else if (method == 'put') {
                        yield axios_1.default[method](url, null, { headers: headers })
                            .then(resp => {
                            resolve(resp);
                        })
                            .catch(e => {
                            var _a, _b, _c;
                            if (((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.status) == 429) {
                                if (isHubspot && ((_c = (_b = e === null || e === void 0 ? void 0 : e.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.policyName) == 'SECONDLY') {
                                    burstRetry = true;
                                }
                                else {
                                    burstRetry = true;
                                }
                            }
                            else {
                                error = e;
                            }
                        });
                    }
                    else {
                        yield axios_1.default[method](url, { headers: headers })
                            .then(resp => {
                            resolve(resp);
                        })
                            .catch(e => {
                            var _a, _b, _c;
                            if (((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.status) == 429) {
                                if (isHubspot && ((_c = (_b = e === null || e === void 0 ? void 0 : e.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.policyName) == 'SECONDLY') {
                                    burstRetry = true;
                                }
                                else {
                                    burstRetry = true;
                                }
                            }
                            else {
                                error = e;
                            }
                        });
                    }
                    if (error) {
                        reject(error);
                        return;
                    }
                    if (burstRetry && retries < 5) {
                        retries++;
                        yield Utils.sleep(Utils.BURST_RETRY_MS);
                        continue;
                    }
                    else {
                        reject(error || 'Request Error');
                        return;
                    }
                }
            }));
        });
    }
    static encrypt(data) {
        const cipher = crypto_1.default.createCipheriv(Utils.CRYPTO_ALGO, Utils.CRYPTO_KEY, Utils.CRYPTO_IV);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        return encrypted.toString('hex');
    }
    static decrypt(data) {
        const decipher = crypto_1.default.createDecipheriv(Utils.CRYPTO_ALGO, Utils.CRYPTO_KEY, Buffer.from(Utils.CRYPTO_IV.toString('hex'), 'hex'));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]);
        return decrypted.toString();
    }
}
Utils.DB_CONFIG = {
    user: 'ManoPortalAdmin',
    password: 'Sh@rkStr0ng',
    server: 'manobyteportal.database.windows.net',
    database: 'NPI-Hubspot'
};
Utils.DB_POOL = new mssql_1.default.ConnectionPool({
    user: 'ManoPortalAdmin',
    password: 'Sh@rkStr0ng',
    server: 'manobyteportal.database.windows.net',
    database: 'NPI-Hubspot'
}).connect();
Utils.HS_API_BASE = 'https://api.hubapi.com';
Utils.NPI_API = 'https://npiregistry.cms.hhs.gov/api?version=2.1';
Utils.HS_CLIENT_ID = 'd151c799-96fe-491f-a9ce-fd6526345f1f';
Utils.HS_CLIENT_SECRET = '57374816-d02d-46ea-b748-ce862e1b14b8';
Utils.HS_APP_ID = 5423483;
// static API_URL = "http://localhost:5000";
Utils.API_URL = "https://npi.manobyte.com";
Utils.STRIPE_API_KEY = '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';
// static STRIPE_API_KEY = 'sk_test_51HNKcmKSKjkjwBcUUIL1cgngGxw9n2FB5ffUAgs6gGBxmERPpegDtkKM8gztKhjuYw0AOBp4JlIhEt7CQwiqxn3S00ojBIGBlN';
Utils.STRIPE_API_URL = 'https://api.stripe.com/';
Utils.STRIPE_PRICE_ID = 'price_1Qf1l6KSKjkjwBcUt9CgDIGT';
// Test Price Id
// static STRIPE_PRICE_ID = 'price_1QeIDlKSKjkjwBcUixw9TB0n';
Utils.CRYPTO_ALGO = 'aes-256-ctr';
Utils.CRYPTO_KEY = 'ncxASDFKLnslkf2345438ck3l4md8012';
Utils.CRYPTO_IV = Buffer.from('aEkd43ndEkLnQWnH');
Utils.BURST_RETRY_MS = 3000;
Utils.MANO_HEADERS = {
    Authorization: `Bearer pat-na1-2b3a1f78-0e45-4a6d-a97f-4988f257577b`
};
Utils.asyncHandler = (fn) => (req, res, next) => {
    return Promise
        .resolve(fn(req, res, next))
        .catch(next);
};
exports.default = Utils;
