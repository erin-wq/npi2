import axios from 'axios';
import crypto from 'crypto';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import sql from 'mssql';

export default class Utils {
    static DB_CONFIG = {
        user: 'ManoPortalAdmin',
        password: 'Sh@rkStr0ng',
        server: 'manobyteportal.database.windows.net',
        database: 'NPI-Hubspot'
    };
    static DB_POOL = new sql.ConnectionPool({
        user: 'ManoPortalAdmin',
        password: 'Sh@rkStr0ng',
        server: 'manobyteportal.database.windows.net',
        database: 'NPI-Hubspot'
    }).connect();
    static HS_API_BASE = 'https://api.hubapi.com';
    static NPI_API = 'https://npiregistry.cms.hhs.gov/api?version=2.1';
    static HS_CLIENT_ID = 'd151c799-96fe-491f-a9ce-fd6526345f1f';
    static HS_CLIENT_SECRET = '57374816-d02d-46ea-b748-ce862e1b14b8';
    static HS_APP_ID = 5423483;
    // static API_URL = "http://localhost:5000";
    static API_URL = "https://npi.manobyte.com";
    static STRIPE_API_KEY = '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';
    // static STRIPE_API_KEY = 'sk_test_51HNKcmKSKjkjwBcUUIL1cgngGxw9n2FB5ffUAgs6gGBxmERPpegDtkKM8gztKhjuYw0AOBp4JlIhEt7CQwiqxn3S00ojBIGBlN';
    static STRIPE_API_URL = 'https://api.stripe.com/';
    static STRIPE_PRICE_ID = 'price_1Qf1l6KSKjkjwBcUt9CgDIGT';
    // Test Price Id
    // static STRIPE_PRICE_ID = 'price_1QeIDlKSKjkjwBcUixw9TB0n';

    static CRYPTO_ALGO = 'aes-256-ctr';
    static CRYPTO_KEY = 'ncxASDFKLnslkf2345438ck3l4md8012';
    static CRYPTO_IV = Buffer.from('aEkd43ndEkLnQWnH');

    static BURST_RETRY_MS = 3000;

    static MANO_HEADERS = {
        Authorization: `Bearer pat-na1-2b3a1f78-0e45-4a6d-a97f-4988f257577b`
    }

    static asyncHandler = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
        return Promise
            .resolve(fn(req, res, next))
            .catch(next);
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static getHSHeaders(accessToken) {
        return {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    static getHSAccessToken(hsPortalId, forceRefresh?, isActiveCheck?): Promise<any> {
        return new Promise(async (resolve, reject) => {
            Utils.DB_POOL
            .then(async pool => {
                let isActiveQuery = '';
                if(isActiveCheck) {
                    isActiveQuery = 'AND IsActive = 1'
                }
                let result;
                try {
                    result = await new sql.Request(pool)
                        .input('HSPortalId', sql.Int, hsPortalId)
                        .query(`SELECT TOP(1) * FROM tblPortalTokens WHERE HSPortalId = @HSPortalId ${isActiveQuery}`);
                } catch(e) { 
                    reject("ERROR");
                    return;
                }
                if(result.recordset[0]) {
                    let tokens = result.recordset[0];
                    if(tokens.Expires < (+ new Date()) || forceRefresh) {
                        console.log("REFRESH");
                        const refreshQuery = `grant_type=refresh_token&client_id=${Utils.HS_CLIENT_ID}&client_secret=${Utils.HS_CLIENT_SECRET}&refresh_token=${tokens.RefreshToken}`;
                        let newTokens;
                        await axios.post('https://api.hubapi.com/oauth/v1/token', refreshQuery)
                        .then(resp => {
                            newTokens = resp?.data;
                        })
                        .catch(e => {
                            reject(e?.response?.data?.status);
                        });
                        if(!newTokens) {
                            return;
                        }
                        let accessToken = newTokens.access_token, 
                            refreshToken = newTokens.refresh_token,
                            expiresIn = newTokens.expires_in;
                        let expiresTimestamp = ((+ new Date()) + (expiresIn * 1000) - 300000); // -5 min to be safe
                        new sql.Request(pool)
                            .input('HSPortalId', hsPortalId)
                            .input('RefreshToken', refreshToken)
                            .input('AccessToken', Utils.encrypt(accessToken))
                            .input('Expires', expiresTimestamp)
                            .execute('prcAddTokens')
                            .catch(e => {
                                console.log(e);
                            });

                        resolve(accessToken);
                    } else {
                        resolve(Utils.decrypt(tokens.AccessToken));
                    }
                } else {
                    reject("NOT FOUND");
                }
            });
        });
    }

    static async request(method: 'get'|'post'|'patch'|'delete'|'put', url: string, headers: any, isHubspot: boolean, data?: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            let retries = 0;

            while(true) {
                let burstRetry = false;
                let error;

                if(data) {
                    await axios[method](url, data, { headers: headers })
                        .then(resp => {
                            resolve(resp);
                        })
                        .catch(e => {
                            if(e?.response?.status == 429) {
                                if(isHubspot && e?.response?.data?.policyName == 'SECONDLY') {
                                    burstRetry = true;
                                } else {
                                    burstRetry = true;
                                }
                            } else {
                                error = e;
                            }
                        })
                } else if(method == 'put') {
                    await axios[method](url, null, { headers: headers })
                        .then(resp => {
                            resolve(resp);
                        })
                        .catch(e => {
                            if(e?.response?.status == 429) {
                                if(isHubspot && e?.response?.data?.policyName == 'SECONDLY') {
                                    burstRetry = true;
                                } else {
                                    burstRetry = true;
                                }
                            } else {
                                error = e;
                            }
                        })
                } else {
                    await axios[method](url, { headers: headers })
                        .then(resp => {
                            resolve(resp);
                        })
                        .catch(e => {
                            if(e?.response?.status == 429) {
                                if(isHubspot && e?.response?.data?.policyName == 'SECONDLY') {
                                    burstRetry = true;
                                } else {
                                    burstRetry = true;
                                }
                            } else {
                                error = e;
                            }
                        })
                }

                if(error) {
                    reject(error);
                    return;
                }

                if(burstRetry && retries < 5) {
                    retries++;
                    await Utils.sleep(Utils.BURST_RETRY_MS);
                    continue;
                } else {
                    reject(error || 'Request Error');
                    return;
                }
            }
        })
    }

    static encrypt(data): string {
        const cipher = crypto.createCipheriv(Utils.CRYPTO_ALGO, Utils.CRYPTO_KEY, Utils.CRYPTO_IV);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        return encrypted.toString('hex');
    }

    static decrypt(data): string {
        const decipher = crypto.createDecipheriv(Utils.CRYPTO_ALGO, Utils.CRYPTO_KEY, Buffer.from(Utils.CRYPTO_IV.toString('hex'), 'hex'));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]);
        return decrypted.toString();
    }
}
