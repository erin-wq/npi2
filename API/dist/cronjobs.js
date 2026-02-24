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
const utils_1 = __importDefault(require("./utils"));
const mssql_1 = __importDefault(require("mssql"));
const cron = require('node-cron');
const stripe = require('stripe')(utils_1.default.STRIPE_API_KEY);
function checkSubscriptions() {
    return __awaiter(this, void 0, void 0, function* () {
        yield utils_1.default.DB_POOL
            .then((pool) => __awaiter(this, void 0, void 0, function* () {
            try {
                const trialMS = 3600000 * 24 * 7; // Last digit is days
                const currentTimestamp = +new Date();
                let result = yield new mssql_1.default.Request(pool)
                    .query('SELECT * FROM tblPortalTokens WHERE (AlwaysActive IS null OR AlwaysActive = 0) AND IsActive = 1');
                for (let i = 0; i < result.recordset.length; i++) {
                    if (result.recordset[i].InstallTime) {
                        const endOfTrial = new Date(result.recordset[i].InstallTime).getTime() + trialMS;
                        // In trial, leave active
                        if (currentTimestamp < endOfTrial) {
                            continue;
                        }
                    }
                    let isActive = true;
                    if (!result.recordset[i].SubscriptionId) {
                        isActive = false;
                    }
                    else {
                        yield stripe.subscriptions.retrieve(result.recordset[i].SubscriptionId)
                            .then(result => {
                            if (result.status != 'active' && result.status != 'past_due') {
                                isActive = false;
                            }
                        })
                            .catch(err => {
                            var _a;
                            if (((_a = err === null || err === void 0 ? void 0 : err.raw) === null || _a === void 0 ? void 0 : _a.code) && err.raw.code == 'resource_missing') {
                                isActive = false;
                            }
                        });
                    }
                    if (!isActive) {
                        try {
                            yield new mssql_1.default.Request(pool)
                                .input('HSPortalId', result.recordset[i].HSPortalId)
                                .query('UPDATE tblPortalTokens SET IsActive = 0, SubscriptionId = null WHERE HSPortalId = @HSPortalId');
                        }
                        catch (e) {
                            console.log(e);
                        }
                    }
                }
            }
            catch (e) { }
        }))
            .catch(e => {
            console.log(e);
        });
    });
}
cron.schedule("0 0 */4 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    yield checkSubscriptions().catch(() => { });
}));
