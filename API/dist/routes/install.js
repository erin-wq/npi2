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
const utils_1 = __importDefault(require("../utils"));
const propertymaps_1 = __importDefault(require("../propertymaps"));
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/properties', utils_1.default.asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // contact
    let accessToken;
    try {
        accessToken = yield utils_1.default.getHSAccessToken(req.session.portalId);
    }
    catch (e) {
        console.log(e);
        res.status(500).send();
        return;
    }
    const hsHeaders = utils_1.default.getHSHeaders(accessToken);
    const propertyGroupData = {
        name: 'manobyte_npi',
        label: 'NPI - ManoByte'
    };
    yield utils_1.default.request('post', `${utils_1.default.HS_API_BASE}/crm/v3/properties/contact/groups`, hsHeaders, true, propertyGroupData)
        .catch(e => {
        var _a;
        console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
    });
    yield utils_1.default.request('post', `${utils_1.default.HS_API_BASE}/crm/v3/properties/company/groups`, hsHeaders, true, propertyGroupData)
        .catch(e => {
        var _a;
        console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
    });
    const contactPropertyData = {
        inputs: propertymaps_1.default.PROPERTIES.filter(p => { return p.isContact; })
    };
    const companyPropertyData = {
        inputs: propertymaps_1.default.PROPERTIES.filter(p => { return p.isCompany; })
    };
    let error;
    yield utils_1.default.request('post', `${utils_1.default.HS_API_BASE}/crm/v3/properties/contact/batch/create`, hsHeaders, true, contactPropertyData)
        .catch(e => {
        var _a, _b;
        console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
        error = ((_b = e === null || e === void 0 ? void 0 : e.response) === null || _b === void 0 ? void 0 : _b.data) || e;
    });
    yield utils_1.default.request('post', `${utils_1.default.HS_API_BASE}/crm/v3/properties/company/batch/create`, hsHeaders, true, companyPropertyData)
        .catch(e => {
        var _a, _b;
        console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
        error = ((_b = e === null || e === void 0 ? void 0 : e.response) === null || _b === void 0 ? void 0 : _b.data) || e;
    });
    if (error) {
        res.status(500).send(error);
    }
    else {
        res.send();
    }
})));
module.exports = router;
