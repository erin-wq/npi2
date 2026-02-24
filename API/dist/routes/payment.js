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
const router = express_1.default.Router();
const utils_1 = __importDefault(require("../utils"));
const mssql_1 = __importDefault(require("mssql"));
const axios_1 = __importDefault(require("axios"));
const stripe = require('stripe')(utils_1.default.STRIPE_API_KEY);
router.get("/status", utils_1.default.asyncHandler(function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let pool;
        yield utils_1.default.DB_POOL
            .then(p => {
            pool = p;
        })
            .catch(e => { console.log(e); });
        if (!pool) {
            res.status(500).send();
            return;
        }
        let subId;
        yield new mssql_1.default.Request(pool)
            .input('HSPortalId', req.session.portalId)
            .query('SELECT TOP(1) SubscriptionId FROM tblPortalTokens WHERE HSPortalId = @HSPortalId')
            .then(result => {
            if (result.recordset.length > 0) {
                subId = result.recordset[0].SubscriptionId;
            }
        })
            .catch(err => { console.log(err); });
        if (!subId) {
            res.send({
                status: 'No payment set up'
            });
            return;
        }
        let isValid = true;
        yield stripe.subscriptions.retrieve(subId)
            .then(result => {
            res.send({
                status: result.status
            });
        })
            .catch(e => {
            console.log(e);
            isValid = false;
        });
        if (!isValid) {
            res.send({
                status: 'Subscription Invalid'
            });
        }
    });
}));
router.post("/", utils_1.default.asyncHandler(function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let error = 'There was an error';
        const body = req.body;
        let pool;
        yield utils_1.default.DB_POOL
            .then(p => {
            pool = p;
        })
            .catch(e => { console.log(e); });
        if (!pool) {
            res.status(500).send();
            return;
        }
        let subId;
        let dbError = false;
        yield new mssql_1.default.Request(pool)
            .input('HSPortalId', req.session.portalId)
            .query('SELECT TOP(1) SubscriptionId FROM tblPortalTokens WHERE HSPortalId = @HSPortalId')
            .then(result => {
            if (result.recordset.length > 0) {
                subId = result.recordset[0].SubscriptionId;
            }
        })
            .catch(err => { dbError = true; console.log(err); });
        // Doesn't have payment yet
        if (!subId) {
            let customerId;
            const customerData = {
                email: body.email,
                "address[line1]": body.address,
                "address[city]": body.city,
                "address[state]": body.state,
                "address[postal_code]": body.zip,
                name: body.firstName + ' ' + body.lastName,
                phone: body.phone
            };
            yield stripe.customers.create(customerData)
                .then(result => {
                customerId = result.id;
            })
                .catch(err => {
                error = err.message;
            });
            if (!customerId) {
                res.status(500).send(error);
                return;
            }
            let paymentMethodId;
            let expMonth = parseInt(body.exp.split('/')[0]);
            let expYear = 2000 + parseInt(body.exp.split('/')[1]);
            const paymentData = {
                type: "card",
                "billing_details[email]": body.email,
                "billing_details[address][line1]": body.address,
                "billing_details[address][city]": body.city,
                "billing_details[address][state]": body.state,
                "billing_details[address][postal_code]": body.zip,
                "billing_details[name]": body.firstName + ' ' + body.lastName,
                "card[number]": body.cc,
                "card[exp_month]": expMonth,
                "card[exp_year]": expYear,
                "card[cvc]": body.cvc
            };
            yield stripe.paymentMethods.create(paymentData)
                .then(result => {
                paymentMethodId = result.id;
            })
                .catch(err => {
                error = err.message;
                console.log(err);
            });
            if (!paymentMethodId) {
                res.status(500).send(error);
                return;
            }
            let attachPaymentSuccess = false;
            const attachPaymentData = {
                customer: customerId
            };
            yield stripe.paymentMethods.attach(paymentMethodId, attachPaymentData)
                .then(result => {
                attachPaymentSuccess = true;
            })
                .catch(err => {
                console.log(err);
                error = err.message;
            });
            if (!attachPaymentSuccess) {
                res.status(500).send(error);
                return;
            }
            let setAsDefaultPaymentSuccess = false;
            yield stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } })
                .then(result => {
                setAsDefaultPaymentSuccess = true;
            })
                .catch(err => {
                console.log(err);
                error = err.message;
            });
            if (!setAsDefaultPaymentSuccess) {
                res.status(500).send(error);
                return;
            }
            const subData = {
                customer: customerId,
                items: [
                    {
                        price: utils_1.default.STRIPE_PRICE_ID,
                        quantity: 1
                    }
                ]
            };
            let subId;
            yield stripe.subscriptions.create(subData)
                .then(result => {
                subId = result.id;
            })
                .catch(err => {
                error = err.message;
                console.log(err);
            });
            if (!subId) {
                res.status(500).send(error);
                return;
            }
            yield new mssql_1.default.Request(pool)
                .input('HSPortalId', req.session.portalId)
                .input('SubscriptionId', subId)
                .input('Email', body.email)
                .query('UPDATE tblPortalTokens SET SubscriptionId = @SubscriptionId, IsActive = 1, Email = @Email WHERE HSPortalId = @HSPortalId')
                .catch(e => { console.log(e); });
            res.send();
            // Adding contact to ManoByte
            const hsContactData = {
                properties: [
                    {
                        property: "firstname",
                        value: body.firstName
                    },
                    {
                        property: "lastname",
                        value: body.lastName
                    },
                    {
                        property: "email",
                        value: body.email
                    },
                    {
                        property: "internal_from_mb_app",
                        value: 'NPI'
                    }
                ]
            };
            axios_1.default.post(`https://api.hubapi.com/contacts/v1/contact/createOrUpdate/email/${body.email}`, hsContactData, { headers: utils_1.default.MANO_HEADERS })
                .catch(e => { console.log(e); });
        }
        else {
            let subItemId;
            let error;
            yield stripe.subscriptions.retrieve(subId)
                .then(result => {
                subItemId = result.items.data[0].id;
            })
                .catch(err => {
                console.log(err);
                error = err.message;
            });
            if (!subItemId) {
                res.status(500).send(error);
                return;
            }
            let pricingData = {
                price: utils_1.default.STRIPE_PRICE_ID,
                quantity: 1,
                proration_behavior: 'none'
            };
            let subPriceUpdateSuccess = true;
            yield stripe.subscriptionItems.update(subItemId, pricingData)
                .catch(err => {
                error = err.message;
            });
            if (!subPriceUpdateSuccess) {
                res.status(500).send(error);
                return;
            }
            let customerId;
            yield stripe.subscriptions.retrieve(subId)
                .then(result => {
                customerId = result.customer;
            })
                .catch(err => {
                console.log(err);
                error = err.message;
            });
            if (!customerId) {
                res.status(500).send(error);
                return;
            }
            let expMonth = parseInt(body.exp.split('/')[0]);
            let expYear = 2000 + parseInt(body.exp.split('/')[1]);
            const paymentData = {
                type: "card",
                "billing_details[email]": body.email,
                "billing_details[address][line1]": body.address,
                "billing_details[address][city]": body.city,
                "billing_details[address][state]": body.state,
                "billing_details[address][postal_code]": body.zip,
                "billing_details[name]": body.firstName + ' ' + body.lastName,
                "card[number]": body.cc,
                "card[exp_month]": expMonth,
                "card[exp_year]": expYear,
                "card[cvc]": body.cvc
            };
            let paymentMethodId;
            yield stripe.paymentMethods.create(paymentData)
                .then(result => {
                paymentMethodId = result.id;
            })
                .catch(err => {
                error = err.message;
                console.log(err);
            });
            if (!paymentMethodId) {
                res.status(500).send(error);
                return;
            }
            let attachPaymentSuccess = false;
            const attachPaymentData = {
                customer: customerId
            };
            yield stripe.paymentMethods.attach(paymentMethodId, attachPaymentData)
                .then(result => {
                attachPaymentSuccess = true;
            })
                .catch(err => {
                error = err.message;
                console.log(err);
            });
            if (!attachPaymentSuccess) {
                res.status(500).send(error);
                return;
            }
            let setAsDefaultPaymentSuccess = false;
            yield stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } })
                .then(result => {
                setAsDefaultPaymentSuccess = true;
            })
                .catch(err => {
                error = err.message;
                console.log(err);
            });
            if (!setAsDefaultPaymentSuccess) {
                res.status(500).send(error);
                return;
            }
            yield new mssql_1.default.Request(pool)
                .input('HSPortalId', req.session.portalId)
                .input('SubscriptionId', subId)
                .input('Email', body.email)
                .query('UPDATE tblPortalTokens SET SubscriptionId = @SubscriptionId, IsActive = 1, Email = @Email WHERE HSPortalId = @HSPortalId')
                .catch(e => { console.log(e); });
            res.send();
        }
    });
}));
router.delete("/", utils_1.default.asyncHandler(function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let subId;
        let error;
        yield utils_1.default.DB_POOL
            .then((pool) => __awaiter(this, void 0, void 0, function* () {
            yield new mssql_1.default.Request(pool)
                .input('HSPortalId', req.session.portalId)
                .query('SELECT SubscriptionId FROM tblPortalTokens WHERE HSPortalId = @HSPortalId')
                .then(result => {
                if (result.recordset.length > 0) {
                    subId = result.recordset[0].SubscriptionId;
                }
            })
                .catch(err => { console.log(err); });
            if (!subId) {
                res.status(500).send("There was an error cancelling your subscription");
                return;
            }
            yield stripe.subscriptions.del(subId)
                .catch(err => {
                error = err.message;
            });
            if (error) {
                res.status(500).send(error);
                return;
            }
            yield new mssql_1.default.Request(pool)
                .input('HSPortalId', req.session.portalId)
                .query('UPDATE tblPortalTokens SET IsActive = 0, SubscriptionId = null WHERE HSPortalId = @HSPortalId')
                .then(result => {
                res.send("Your subscription has been cancelled");
            })
                .catch(err => { res.status(500).send("There was an error cancelling your subscription"); });
        }))
            .catch(err => { console.log(err); });
    });
}));
module.exports = router;
