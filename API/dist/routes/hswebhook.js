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
const express_1 = __importDefault(require("express"));
const propertymaps_1 = __importDefault(require("../propertymaps"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
let hsQueue = {};
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const previousQueue = JSON.parse(fs_1.default.readFileSync('hsqueue.json', 'utf8'));
            if (previousQueue && typeof previousQueue === 'object') {
                hsQueue = previousQueue;
            }
        }
        catch (e) { }
        hsWebhookLoop();
    });
}
init();
function hsWebhookLoop() {
    return __awaiter(this, void 0, void 0, function* () {
        for (const portalID in hsQueue) {
            if (hsQueue[portalID].length) {
                const queueItem = hsQueue[portalID].shift();
                if (queueItem.objectType == 'contact') {
                    handleContact(queueItem)
                        .catch(e => { console.log(e); });
                }
                else if (queueItem.objectType == 'company') {
                    handleCompany(queueItem)
                        .catch(e => { console.log(e); });
                }
            }
        }
        yield utils_1.default.sleep(200);
        hsWebhookLoop();
    });
}
router.post('/', utils_1.default.asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Webhook Validation
    let reqString = Buffer.from(utils_1.default.HS_CLIENT_SECRET +
        'POST' +
        'https://' + req.get('host') + req.originalUrl +
        req.rawBody, 'utf-8').toString();
    // v1 version is simply secret + body
    if (req.header('X-HubSpot-Signature-Version') == 'v1') {
        reqString = utils_1.default.HS_CLIENT_SECRET + req.rawBody;
    }
    const reqHash = crypto_1.default.createHash('sha256').update(reqString).digest('hex');
    if (reqHash != req.header('X-HubSpot-Signature')) {
        console.log("INVALID HEADER");
        res.status(403).send('HEADER_ERROR');
        return;
    }
    res.send();
    for (const wh of req.body) {
        if (wh.changeSource == 'INTEGRATION' && wh.sourceId == utils_1.default.HS_APP_ID) {
            continue;
        }
        // Only getting webhooks for the run check prop, only need to run when set to true
        if (wh.propertyValue != 'true') {
            continue;
        }
        let queueItem = {
            objectType: 'contact',
            objectId: wh.objectId,
            activityDate: new Date().getTime(),
            portalId: wh.portalId
        };
        if (wh.subscriptionType.includes('company')) {
            queueItem.objectType = 'company';
        }
        if (!hsQueue[wh.portalId]) {
            hsQueue[wh.portalId] = [];
        }
        hsQueue[wh.portalId].push(queueItem);
    }
    fs_1.default.writeFile('hsqueue.json', JSON.stringify(hsQueue), (err) => { console.log(err); });
})));
/*handleContact({
    objectId: 83465913203,
    objectType: 'contact',
    activityDate: 123,
    portalId: 2660272
})*/
function handleContact(queueItem) {
    return __awaiter(this, void 0, void 0, function* () {
        let accessToken;
        yield utils_1.default.getHSAccessToken(queueItem.portalId, false, true)
            .then(token => {
            accessToken = token;
        })
            .catch(e => {
            console.log(e);
        });
        if (!accessToken) {
            return;
        }
        const hsHeaders = utils_1.default.getHSHeaders(accessToken);
        const contactPropertiesString = 'firstname,lastname,zip,manobyte_npi_number';
        let contactData;
        yield utils_1.default.request('get', `${utils_1.default.HS_API_BASE}/crm/v3/objects/contact/${queueItem.objectId}?properties=${contactPropertiesString}`, hsHeaders, true)
            .then(resp => {
            contactData = resp.data.properties;
        })
            .catch(e => {
            var _a;
            console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
        });
        if (!contactData) {
            return;
        }
        if (!contactData.manobyte_npi_number && (!contactData.firstname || !contactData.lastname || !contactData.zip)) {
            const contactUpdateData = {
                properties: {
                    manobyte_npi_no_match: true,
                    manobyte_npi_last_checked: new Date().getTime(),
                }
            };
            yield utils_1.default.request('patch', `${utils_1.default.HS_API_BASE}/crm/v3/objects/contact/${queueItem.objectId}`, hsHeaders, true, contactUpdateData)
                .catch(e => {
                var _a;
                console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
            });
            return;
        }
        let npiData;
        if (contactData.manobyte_npi_number) {
            contactData.manobyte_npi_number = contactData.manobyte_npi_number.trim();
            yield utils_1.default.request('get', `${utils_1.default.NPI_API}&number=${encodeURIComponent(contactData.manobyte_npi_number)}`, hsHeaders, false)
                .then(resp => {
                var _a;
                if (((_a = resp === null || resp === void 0 ? void 0 : resp.data) === null || _a === void 0 ? void 0 : _a.results) && resp.data.results.length > 0) {
                    npiData = resp.data.results[0];
                }
            })
                .catch(e => {
                var _a;
                console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
            });
        }
        else {
            yield utils_1.default.request('get', `${utils_1.default.NPI_API}&first_name=${encodeURIComponent(contactData.firstname)}&last_name=${encodeURIComponent(contactData.lastname)}&postal_code=${encodeURIComponent(contactData.zip)}`, hsHeaders, false)
                .then(resp => {
                var _a;
                if (((_a = resp === null || resp === void 0 ? void 0 : resp.data) === null || _a === void 0 ? void 0 : _a.results) && resp.data.results.length > 0) {
                    npiData = resp.data.results[0];
                }
            })
                .catch(e => {
                var _a;
                console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
            });
        }
        if (!npiData) {
            const contactUpdateData = {
                properties: {
                    manobyte_npi_no_match: true,
                    manobyte_npi_last_checked: new Date().getTime(),
                }
            };
            yield utils_1.default.request('patch', `${utils_1.default.HS_API_BASE}/crm/v3/objects/contact/${queueItem.objectId}`, hsHeaders, true, contactUpdateData)
                .catch(e => {
                var _a;
                console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
            });
            return;
        }
        const contactUpdateData = {
            properties: {
                manobyte_npi_no_match: false,
                manobyte_npi_last_checked: new Date().getTime(),
                manobyte_npi_number: npiData.number,
                manobyte_npi_last_updated: npiData.last_updated_epoch
            }
        };
        for (const key in propertymaps_1.default.CONTACT_BASIC_MAP) {
            if (npiData.basic[key]) {
                contactUpdateData.properties[propertymaps_1.default.CONTACT_BASIC_MAP[key]] = propertymaps_1.default.propertyFormatter(key, npiData.basic[key]);
            }
            else {
                contactUpdateData.properties[propertymaps_1.default.CONTACT_BASIC_MAP[key]] = '';
            }
        }
        if (npiData.addresses && npiData.addresses.length > 0) {
            const locationAddress = npiData.addresses.find(a => {
                return a.address_purpose == 'LOCATION';
            });
            if (locationAddress) {
                for (const key in propertymaps_1.default.LOCATION_ADDRESS_MAP) {
                    if (locationAddress[key]) {
                        contactUpdateData.properties[propertymaps_1.default.LOCATION_ADDRESS_MAP[key]] = propertymaps_1.default.propertyFormatter(key, locationAddress[key]);
                    }
                    else {
                        contactUpdateData.properties[propertymaps_1.default.LOCATION_ADDRESS_MAP[key]] = '';
                    }
                }
            }
            const mailingAddress = npiData.addresses.find(a => {
                return a.address_purpose == 'MAILING';
            });
            if (mailingAddress) {
                for (const key in propertymaps_1.default.MAILING_ADDRESS_MAP) {
                    if (mailingAddress[key]) {
                        contactUpdateData.properties[propertymaps_1.default.MAILING_ADDRESS_MAP[key]] = propertymaps_1.default.propertyFormatter(key, mailingAddress[key]);
                    }
                    else {
                        contactUpdateData.properties[propertymaps_1.default.MAILING_ADDRESS_MAP[key]] = '';
                    }
                }
            }
        }
        if (npiData.practiceLocations && npiData.practiceLocations.length > 0) {
            let practiceLocationString = '';
            for (let i = 0; i < npiData.practiceLocations.length; i++) {
                const location = npiData.practiceLocations[i];
                for (const key in propertymaps_1.default.LOCATION_ADDRESS_MAP) {
                    if (location[key]) {
                        practiceLocationString += location[key] + ' ';
                    }
                }
                if (i < npiData.practiceLocations.length - 1) {
                    practiceLocationString += '\n\n';
                }
            }
            contactUpdateData.properties['manobyte_npi_practice_locations'] = practiceLocationString;
        }
        if (npiData.taxonomies && npiData.taxonomies.length > 0) {
            let taxonomiesString = '';
            const primaryTaxonomy = npiData.taxonomies.find(t => {
                return t.primary;
            });
            if (primaryTaxonomy) {
                for (const key of propertymaps_1.default.TAXONOMY_FIELDS) {
                    if (primaryTaxonomy[key]) {
                        taxonomiesString += primaryTaxonomy[key] + ' ';
                    }
                }
            }
            const nonPrimaryTaxonomies = npiData.taxonomies.filter(t => {
                return !t.primary;
            });
            for (let i = 0; i < nonPrimaryTaxonomies.length; i++) {
                const taxonomy = nonPrimaryTaxonomies[i];
                taxonomiesString += '\n\n';
                for (const key of propertymaps_1.default.TAXONOMY_FIELDS) {
                    if (taxonomy[key]) {
                        taxonomiesString += taxonomy[key] + ' ';
                    }
                }
            }
            contactUpdateData.properties['manobyte_npi_taxonomies'] = taxonomiesString;
        }
        if (npiData.identifiers && npiData.identifiers.length > 0) {
            let identifiersString = '';
            for (let i = 0; i < npiData.identifiers.length; i++) {
                const identifier = npiData.identifiers[i];
                if (i > 0) {
                    identifiersString += '\n\n';
                }
                for (const key of propertymaps_1.default.IDENTIFIER_FIELDS) {
                    if (identifier[key]) {
                        identifiersString += identifier[key] + ' ';
                    }
                }
            }
            contactUpdateData.properties['manobyte_npi_identifiers'] = identifiersString;
        }
        if (npiData.endpoints && npiData.endpoints.length > 0) {
            let endpointsString = '';
            for (let i = 0; i < npiData.endpoints.length; i++) {
                const endpoint = npiData.endpoints[i];
                if (i > 0) {
                    endpointsString += '\n\n';
                }
                for (let j = 0; j < propertymaps_1.default.ENDPOINT_FIELDS.length; j++) {
                    const key = propertymaps_1.default.ENDPOINT_FIELDS[j];
                    if (endpoint[key]) {
                        endpointsString += endpoint[key];
                    }
                    if (j < 3) {
                        endpointsString += '\n';
                    }
                    else {
                        endpointsString += ' ';
                    }
                }
            }
            contactUpdateData.properties['manobyte_npi_endpoints'] = endpointsString;
        }
        if (npiData.other_names && npiData.other_names.length > 0) {
            let otherNamesString = '';
            for (let i = 0; i < npiData.other_names.length; i++) {
                const name = npiData.other_names[i];
                if (i > 0) {
                    otherNamesString += '\n\n';
                }
                for (const key of propertymaps_1.default.CONTACT_OTHER_NAME_FIELDS) {
                    if (name[key] && name[key] != '--') {
                        otherNamesString += name[key] + ' ';
                    }
                    if (key == 'type') {
                        otherNamesString += '\n';
                    }
                }
            }
            contactUpdateData.properties['manobyte_npi_other_names'] = otherNamesString;
        }
        yield utils_1.default.request('patch', `${utils_1.default.HS_API_BASE}/crm/v3/objects/contact/${queueItem.objectId}`, hsHeaders, true, contactUpdateData)
            .catch(e => {
            var _a;
            console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
        });
    });
}
/*handleCompany({
    objectId: 26828751385,
    objectType: 'company',
    activityDate: 123,
    portalId: 2660272
})*/
function handleCompany(queueItem) {
    return __awaiter(this, void 0, void 0, function* () {
        let accessToken;
        yield utils_1.default.getHSAccessToken(queueItem.portalId, false, true)
            .then(token => {
            accessToken = token;
        })
            .catch(e => {
            console.log(e);
        });
        if (!accessToken) {
            return;
        }
        const hsHeaders = utils_1.default.getHSHeaders(accessToken);
        const companyPropertiesString = 'name,zip,manobyte_npi_number';
        let companyData;
        yield utils_1.default.request('get', `${utils_1.default.HS_API_BASE}/crm/v3/objects/company/${queueItem.objectId}?properties=${companyPropertiesString}`, hsHeaders, true)
            .then(resp => {
            companyData = resp.data.properties;
        })
            .catch(e => {
            var _a;
            console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
        });
        if (!companyData) {
            return;
        }
        if (!companyData.manobyte_npi_number && (!companyData.name || !companyData.zip)) {
            const companyUpdateData = {
                properties: {
                    manobyte_npi_no_match: true,
                    manobyte_npi_last_checked: new Date().getTime()
                }
            };
            yield utils_1.default.request('patch', `${utils_1.default.HS_API_BASE}/crm/v3/objects/company/${queueItem.objectId}`, hsHeaders, true, companyUpdateData)
                .catch(e => {
                var _a;
                console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
            });
            return;
        }
        let npiData;
        if (companyData.manobyte_npi_number) {
            companyData.manobyte_npi_number = companyData.manobyte_npi_number.trim();
            yield utils_1.default.request('get', `${utils_1.default.NPI_API}&number=${encodeURIComponent(companyData.manobyte_npi_number)}`, hsHeaders, false)
                .then(resp => {
                var _a;
                if (((_a = resp === null || resp === void 0 ? void 0 : resp.data) === null || _a === void 0 ? void 0 : _a.results) && resp.data.results.length > 0) {
                    npiData = resp.data.results[0];
                }
            })
                .catch(e => {
                var _a;
                console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
            });
        }
        else {
            yield utils_1.default.request('get', `${utils_1.default.NPI_API}&organization_name=${encodeURIComponent(companyData.name)}&postal_code=${encodeURIComponent(companyData.zip)}`, hsHeaders, false)
                .then(resp => {
                var _a;
                if (((_a = resp === null || resp === void 0 ? void 0 : resp.data) === null || _a === void 0 ? void 0 : _a.results) && resp.data.results.length > 0) {
                    npiData = resp.data.results[0];
                }
            })
                .catch(e => {
                var _a;
                console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
            });
        }
        if (!npiData) {
            const companyUpdateData = {
                properties: {
                    manobyte_npi_no_match: true,
                    manobyte_npi_last_checked: new Date().getTime()
                }
            };
            yield utils_1.default.request('patch', `${utils_1.default.HS_API_BASE}/crm/v3/objects/company/${queueItem.objectId}`, hsHeaders, true, companyUpdateData)
                .catch(e => {
                var _a;
                console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
            });
            return;
        }
        const companyUpdateData = {
            properties: {
                manobyte_npi_no_match: false,
                manobyte_npi_last_checked: new Date().getTime(),
                manobyte_npi_number: npiData.number,
                manobyte_npi_last_updated: npiData.last_updated_epoch
            }
        };
        for (const key in propertymaps_1.default.COMPANY_BASIC_MAP) {
            if (npiData.basic[key]) {
                companyUpdateData.properties[propertymaps_1.default.COMPANY_BASIC_MAP[key]] = propertymaps_1.default.propertyFormatter(key, npiData.basic[key]);
            }
            else {
                companyUpdateData.properties[propertymaps_1.default.COMPANY_BASIC_MAP[key]] = '';
            }
        }
        if (npiData.addresses && npiData.addresses.length > 0) {
            const locationAddress = npiData.addresses.find(a => {
                return a.address_purpose == 'LOCATION';
            });
            if (locationAddress) {
                for (const key in propertymaps_1.default.LOCATION_ADDRESS_MAP) {
                    if (locationAddress[key]) {
                        companyUpdateData.properties[propertymaps_1.default.LOCATION_ADDRESS_MAP[key]] = propertymaps_1.default.propertyFormatter(key, locationAddress[key]);
                    }
                    else {
                        companyUpdateData.properties[propertymaps_1.default.LOCATION_ADDRESS_MAP[key]] = '';
                    }
                }
            }
            const mailingAddress = npiData.addresses.find(a => {
                return a.address_purpose == 'MAILING';
            });
            if (mailingAddress) {
                for (const key in propertymaps_1.default.MAILING_ADDRESS_MAP) {
                    if (mailingAddress[key]) {
                        companyUpdateData.properties[propertymaps_1.default.MAILING_ADDRESS_MAP[key]] = propertymaps_1.default.propertyFormatter(key, mailingAddress[key]);
                    }
                    else {
                        companyUpdateData.properties[propertymaps_1.default.MAILING_ADDRESS_MAP[key]] = '';
                    }
                }
            }
        }
        if (npiData.practiceLocations && npiData.practiceLocations.length > 0) {
            let practiceLocationString = '';
            for (let i = 0; i < npiData.practiceLocations.length; i++) {
                const location = npiData.practiceLocations[i];
                for (const key in propertymaps_1.default.LOCATION_ADDRESS_MAP) {
                    if (location[key]) {
                        practiceLocationString += location[key] + ' ';
                    }
                }
                if (i < npiData.practiceLocations.length - 1) {
                    practiceLocationString += '\n\n';
                }
            }
            companyUpdateData.properties['manobyte_npi_practice_locations'] = practiceLocationString;
        }
        if (npiData.taxonomies && npiData.taxonomies.length > 0) {
            let taxonomiesString = '';
            const primaryTaxonomy = npiData.taxonomies.find(t => {
                return t.primary;
            });
            if (primaryTaxonomy) {
                for (const key of propertymaps_1.default.TAXONOMY_FIELDS) {
                    if (primaryTaxonomy[key]) {
                        taxonomiesString += primaryTaxonomy[key] + ' ';
                    }
                }
            }
            const nonPrimaryTaxonomies = npiData.taxonomies.filter(t => {
                return !t.primary;
            });
            for (let i = 0; i < nonPrimaryTaxonomies.length; i++) {
                const taxonomy = nonPrimaryTaxonomies[i];
                taxonomiesString += '\n\n';
                for (const key of propertymaps_1.default.TAXONOMY_FIELDS) {
                    if (taxonomy[key]) {
                        taxonomiesString += taxonomy[key] + ' ';
                    }
                }
            }
            companyUpdateData.properties['manobyte_npi_taxonomies'] = taxonomiesString;
        }
        if (npiData.identifiers && npiData.identifiers.length > 0) {
            let identifiersString = '';
            for (let i = 0; i < npiData.identifiers.length; i++) {
                const identifier = npiData.identifiers[i];
                if (i > 0) {
                    identifiersString += '\n\n';
                }
                for (const key of propertymaps_1.default.IDENTIFIER_FIELDS) {
                    if (identifier[key]) {
                        identifiersString += identifier[key] + ' ';
                    }
                }
            }
            companyUpdateData.properties['manobyte_npi_identifiers'] = identifiersString;
        }
        if (npiData.endpoints && npiData.endpoints.length > 0) {
            let endpointsString = '';
            for (let i = 0; i < npiData.endpoints.length; i++) {
                const endpoint = npiData.endpoints[i];
                if (i > 0) {
                    endpointsString += '\n\n';
                }
                for (let j = 0; j < propertymaps_1.default.ENDPOINT_FIELDS.length; j++) {
                    const key = propertymaps_1.default.ENDPOINT_FIELDS[j];
                    if (endpoint[key]) {
                        endpointsString += endpoint[key];
                    }
                    if (j < 3) {
                        endpointsString += '\n';
                    }
                    else {
                        endpointsString += ' ';
                    }
                }
            }
            companyUpdateData.properties['manobyte_npi_endpoints'] = endpointsString;
        }
        if (npiData.other_names && npiData.other_names.length > 0) {
            let otherNamesString = '';
            for (let i = 0; i < npiData.other_names.length; i++) {
                const name = npiData.other_names[i];
                if (i > 0) {
                    otherNamesString += '\n\n';
                }
                for (const key of propertymaps_1.default.COMPANY_OTHER_NAME_FIELDS) {
                    if (name[key] && name[key] != '--') {
                        otherNamesString += name[key] + ' ';
                    }
                    if (key == 'type') {
                        otherNamesString += '\n';
                    }
                }
            }
            companyUpdateData.properties['manobyte_npi_other_names'] = otherNamesString;
        }
        yield utils_1.default.request('patch', `${utils_1.default.HS_API_BASE}/crm/v3/objects/company/${queueItem.objectId}`, hsHeaders, true, companyUpdateData)
            .catch(e => {
            var _a;
            console.log(((_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) || e);
        });
    });
}
module.exports = router;
