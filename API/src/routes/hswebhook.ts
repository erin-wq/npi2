import Utils from'../utils';
import express from 'express';
import PropertyMaps from '../propertymaps';
import crypto from 'crypto';
import fs from 'fs';
const router = express.Router();

let hsQueue = {};
async function init() {
    try {
        const previousQueue = JSON.parse(fs.readFileSync('hsqueue.json', 'utf8'));
        if(previousQueue && typeof previousQueue === 'object') {
            hsQueue = previousQueue;
        }
    } catch(e) {  }
    hsWebhookLoop();
}
init();

async function hsWebhookLoop() {
    for(const portalID in hsQueue) {
        if(hsQueue[portalID].length) {
            const queueItem = hsQueue[portalID].shift();
            if(queueItem.objectType == 'contact') {
                handleContact(queueItem)
                    .catch(e => { console.log(e); });
            } else if(queueItem.objectType == 'company') {
                handleCompany(queueItem)
                    .catch(e => { console.log(e); });
            } 
        }
    }

    await Utils.sleep(200);
    hsWebhookLoop();
}

router.post('/', Utils.asyncHandler(async (req, res) => {
    // Webhook Validation
    let reqString = Buffer.from(
        Utils.HS_CLIENT_SECRET + 
        'POST' + 
        'https://' + req.get('host') + req.originalUrl + 
        (req as any).rawBody
    , 'utf-8').toString();
    // v1 version is simply secret + body
    if(req.header('X-HubSpot-Signature-Version') == 'v1') {
        reqString = Utils.HS_CLIENT_SECRET + (req as any).rawBody;
    }
    const reqHash = crypto.createHash('sha256').update(reqString).digest('hex');

    if(reqHash != req.header('X-HubSpot-Signature')) {
        console.log("INVALID HEADER");
        res.status(403).send('HEADER_ERROR');
        return;
    }

    res.send();

    for(const wh of req.body) {
        if(wh.changeSource == 'INTEGRATION' && wh.sourceId == Utils.HS_APP_ID) {
            continue;
        }

        // Only getting webhooks for the run check prop, only need to run when set to true
        if(wh.propertyValue != 'true') {
            continue;
        }

        let queueItem : HSQueueItem = {
            objectType: 'contact',
            objectId: wh.objectId,
            activityDate: new Date().getTime(),
            portalId: wh.portalId
        }
        if(wh.subscriptionType.includes('company')) {
            queueItem.objectType = 'company';
        }

        if(!hsQueue[wh.portalId]) {
            hsQueue[wh.portalId] = [];
        }
        hsQueue[wh.portalId].push(queueItem);
    }

    fs.writeFile('hsqueue.json', JSON.stringify(hsQueue), (err) => {console.log(err)});
}))

/*handleContact({
    objectId: 83465913203,
    objectType: 'contact',
    activityDate: 123,
    portalId: 2660272
})*/
async function handleContact(queueItem: HSQueueItem) {
    let accessToken;
    await Utils.getHSAccessToken(queueItem.portalId, false, true)
        .then(token => {
            accessToken = token;
        })
        .catch(e => {
            console.log(e);
        });
    if(!accessToken) {
        return;
    } 
    const hsHeaders = Utils.getHSHeaders(accessToken);

    const contactPropertiesString = 'firstname,lastname,zip,manobyte_npi_number';
    let contactData;
    await Utils.request('get', `${Utils.HS_API_BASE}/crm/v3/objects/contact/${queueItem.objectId}?properties=${contactPropertiesString}`, hsHeaders, true)
        .then(resp => {
            contactData = resp.data.properties;
        })
        .catch(e => {
            console.log(e?.response?.data || e);
        })

    if(!contactData) {
        return;
    }

    if(!contactData.manobyte_npi_number && (!contactData.firstname || !contactData.lastname || !contactData.zip)) {
        const contactUpdateData = {
            properties: {
                manobyte_npi_no_match: true,
                manobyte_npi_last_checked: new Date().getTime(),
            }
        }

        await Utils.request('patch', `${Utils.HS_API_BASE}/crm/v3/objects/contact/${queueItem.objectId}`, hsHeaders, true, contactUpdateData)
            .catch(e => {
                console.log(e?.response?.data || e);
            })

        return;
    }

    let npiData;

    if(contactData.manobyte_npi_number) {
        contactData.manobyte_npi_number = contactData.manobyte_npi_number.trim();
        await Utils.request('get', `${Utils.NPI_API}&number=${encodeURIComponent(contactData.manobyte_npi_number)}`, hsHeaders, false)
            .then(resp => {
                if(resp?.data?.results && resp.data.results.length > 0) {
                    npiData = resp.data.results[0];
                }
            })
            .catch(e => {
                console.log(e?.response?.data || e);
            })
    } else {
        await Utils.request('get', `${Utils.NPI_API}&first_name=${encodeURIComponent(contactData.firstname)}&last_name=${encodeURIComponent(contactData.lastname)}&postal_code=${encodeURIComponent(contactData.zip)}`, hsHeaders, false)
            .then(resp => {
                if(resp?.data?.results && resp.data.results.length > 0) {
                    npiData = resp.data.results[0];
                }
            })
            .catch(e => {
                console.log(e?.response?.data || e);
            })
    }

    if(!npiData) {
        const contactUpdateData = {
            properties: {
                manobyte_npi_no_match: true,
                manobyte_npi_last_checked: new Date().getTime(),
            }
        }

        await Utils.request('patch', `${Utils.HS_API_BASE}/crm/v3/objects/contact/${queueItem.objectId}`, hsHeaders, true, contactUpdateData)
            .catch(e => {
                console.log(e?.response?.data || e);
            })

        return;
    }

    const contactUpdateData = {
        properties: {
            manobyte_npi_no_match: false,
            manobyte_npi_last_checked: new Date().getTime(),
            manobyte_npi_number: npiData.number,
            manobyte_npi_last_updated: npiData.last_updated_epoch
        }
    }

    for(const key in PropertyMaps.CONTACT_BASIC_MAP) {
        if(npiData.basic[key]) {
            contactUpdateData.properties[PropertyMaps.CONTACT_BASIC_MAP[key]] = PropertyMaps.propertyFormatter(key, npiData.basic[key]);
        } else {
            contactUpdateData.properties[PropertyMaps.CONTACT_BASIC_MAP[key]] = '';
        }
    }

    if(npiData.addresses && npiData.addresses.length > 0) {
        const locationAddress = npiData.addresses.find(a => {
            return a.address_purpose == 'LOCATION';
        })
        if(locationAddress) {
            for(const key in PropertyMaps.LOCATION_ADDRESS_MAP) {
                if(locationAddress[key]) {
                    contactUpdateData.properties[PropertyMaps.LOCATION_ADDRESS_MAP[key]] = PropertyMaps.propertyFormatter(key, locationAddress[key]);
                } else {
                    contactUpdateData.properties[PropertyMaps.LOCATION_ADDRESS_MAP[key]] = '';
                }
            }
        }

        const mailingAddress = npiData.addresses.find(a => {
            return a.address_purpose == 'MAILING';
        })
        if(mailingAddress) {
            for(const key in PropertyMaps.MAILING_ADDRESS_MAP) {
                if(mailingAddress[key]) {
                    contactUpdateData.properties[PropertyMaps.MAILING_ADDRESS_MAP[key]] = PropertyMaps.propertyFormatter(key, mailingAddress[key]);
                } else {
                    contactUpdateData.properties[PropertyMaps.MAILING_ADDRESS_MAP[key]] = '';
                }
            }
        }
    }

    if(npiData.practiceLocations && npiData.practiceLocations.length > 0) {
        let practiceLocationString = '';
        for(let i = 0; i < npiData.practiceLocations.length; i++) {
            const location = npiData.practiceLocations[i];
            for(const key in PropertyMaps.LOCATION_ADDRESS_MAP) {
                if(location[key]) {
                    practiceLocationString += location[key] + ' ';
                }
            }
            if(i < npiData.practiceLocations.length - 1) {
                practiceLocationString += '\n\n';
            }
        }
        contactUpdateData.properties['manobyte_npi_practice_locations'] = practiceLocationString;
    }

    if(npiData.taxonomies && npiData.taxonomies.length > 0) {
        let taxonomiesString = '';
        const primaryTaxonomy = npiData.taxonomies.find(t => {
            return t.primary
        })
        if(primaryTaxonomy) {
            for(const key of PropertyMaps.TAXONOMY_FIELDS) {
                if(primaryTaxonomy[key]) {
                    taxonomiesString += primaryTaxonomy[key] + ' ';
                }
            }
        }
        const nonPrimaryTaxonomies = npiData.taxonomies.filter(t => {
            return !t.primary
        })
        for(let i = 0; i < nonPrimaryTaxonomies.length; i++) {
            const taxonomy = nonPrimaryTaxonomies[i];
            taxonomiesString += '\n\n';
            for(const key of PropertyMaps.TAXONOMY_FIELDS) {
                if(taxonomy[key]) {
                    taxonomiesString += taxonomy[key] + ' ';
                }
            }
        }

        contactUpdateData.properties['manobyte_npi_taxonomies'] = taxonomiesString;
    }

    if(npiData.identifiers && npiData.identifiers.length > 0) {
        let identifiersString = '';
        for(let i = 0; i < npiData.identifiers.length; i++) {
            const identifier = npiData.identifiers[i];
            if(i > 0) {
                identifiersString += '\n\n';
            }
            for(const key of PropertyMaps.IDENTIFIER_FIELDS) {
                if(identifier[key]) {
                    identifiersString += identifier[key] + ' ';
                }
            }
        }

        contactUpdateData.properties['manobyte_npi_identifiers'] = identifiersString;
    }

    if(npiData.endpoints && npiData.endpoints.length > 0) {
        let endpointsString = '';
        for(let i = 0; i < npiData.endpoints.length; i++) {
            const endpoint = npiData.endpoints[i];
            if(i > 0) {
                endpointsString += '\n\n';
            }
            for(let j = 0; j < PropertyMaps.ENDPOINT_FIELDS.length; j++) {
                const key = PropertyMaps.ENDPOINT_FIELDS[j];
                if(endpoint[key]) {
                    endpointsString += endpoint[key];
                }
                if(j < 3) {
                    endpointsString += '\n';
                } else {
                    endpointsString += ' ';
                }
            }
        }

        contactUpdateData.properties['manobyte_npi_endpoints'] = endpointsString;
    }

    if(npiData.other_names && npiData.other_names.length > 0) {
        let otherNamesString = '';
        for(let i = 0; i < npiData.other_names.length; i++) {
            const name = npiData.other_names[i];
            if(i > 0) {
                otherNamesString += '\n\n';
            }
            for(const key of PropertyMaps.CONTACT_OTHER_NAME_FIELDS) {
                if(name[key] && name[key] != '--') {
                    otherNamesString += name[key] + ' ';
                }
                if(key == 'type') {
                    otherNamesString += '\n';
                }
            }
        }

        contactUpdateData.properties['manobyte_npi_other_names'] = otherNamesString;
    }

    await Utils.request('patch', `${Utils.HS_API_BASE}/crm/v3/objects/contact/${queueItem.objectId}`, hsHeaders, true, contactUpdateData)
        .catch(e => {
            console.log(e?.response?.data || e);
        })
}

/*handleCompany({
    objectId: 26828751385,
    objectType: 'company',
    activityDate: 123,
    portalId: 2660272
})*/
async function handleCompany(queueItem: HSQueueItem) {
    let accessToken;
    await Utils.getHSAccessToken(queueItem.portalId, false, true)
        .then(token => {
            accessToken = token;
        })
        .catch(e => {
            console.log(e);
        });
    if(!accessToken) {
        return;
    } 
    const hsHeaders = Utils.getHSHeaders(accessToken);

    const companyPropertiesString = 'name,zip,manobyte_npi_number';
    let companyData;
    await Utils.request('get', `${Utils.HS_API_BASE}/crm/v3/objects/company/${queueItem.objectId}?properties=${companyPropertiesString}`, hsHeaders, true)
        .then(resp => {
            companyData = resp.data.properties;
        })
        .catch(e => {
            console.log(e?.response?.data || e);
        })

    if(!companyData) {
        return;
    }

    if(!companyData.manobyte_npi_number && (!companyData.name || !companyData.zip)) {
        const companyUpdateData = {
            properties: {
                manobyte_npi_no_match: true,
                manobyte_npi_last_checked: new Date().getTime()
            }
        }

        await Utils.request('patch', `${Utils.HS_API_BASE}/crm/v3/objects/company/${queueItem.objectId}`, hsHeaders, true, companyUpdateData)
            .catch(e => {
                console.log(e?.response?.data || e);
            })

        return;
    }

    let npiData;

    if(companyData.manobyte_npi_number) {
        companyData.manobyte_npi_number = companyData.manobyte_npi_number.trim();
        await Utils.request('get', `${Utils.NPI_API}&number=${encodeURIComponent(companyData.manobyte_npi_number)}`, hsHeaders, false)
            .then(resp => {
                if(resp?.data?.results && resp.data.results.length > 0) {
                    npiData = resp.data.results[0];
                }
            })
            .catch(e => {
                console.log(e?.response?.data || e);
            })
    } else {
        await Utils.request('get', `${Utils.NPI_API}&organization_name=${encodeURIComponent(companyData.name)}&postal_code=${encodeURIComponent(companyData.zip)}`, hsHeaders, false)
            .then(resp => {
                if(resp?.data?.results && resp.data.results.length > 0) {
                    npiData = resp.data.results[0];
                }
            })
            .catch(e => {
                console.log(e?.response?.data || e);
            })
    }

    if(!npiData) {
        const companyUpdateData = {
            properties: {
                manobyte_npi_no_match: true,
                manobyte_npi_last_checked: new Date().getTime()
            }
        }

        await Utils.request('patch', `${Utils.HS_API_BASE}/crm/v3/objects/company/${queueItem.objectId}`, hsHeaders, true, companyUpdateData)
            .catch(e => {
                console.log(e?.response?.data || e);
            })

        return;
    }

    const companyUpdateData = {
        properties: {
            manobyte_npi_no_match: false,
            manobyte_npi_last_checked: new Date().getTime(),
            manobyte_npi_number: npiData.number,
            manobyte_npi_last_updated: npiData.last_updated_epoch
        }
    }

    for(const key in PropertyMaps.COMPANY_BASIC_MAP) {
        if(npiData.basic[key]) {
            companyUpdateData.properties[PropertyMaps.COMPANY_BASIC_MAP[key]] = PropertyMaps.propertyFormatter(key, npiData.basic[key]);
        } else {
            companyUpdateData.properties[PropertyMaps.COMPANY_BASIC_MAP[key]] = '';
        }
    }

    if(npiData.addresses && npiData.addresses.length > 0) {
        const locationAddress = npiData.addresses.find(a => {
            return a.address_purpose == 'LOCATION';
        })
        if(locationAddress) {
            for(const key in PropertyMaps.LOCATION_ADDRESS_MAP) {
                if(locationAddress[key]) {
                    companyUpdateData.properties[PropertyMaps.LOCATION_ADDRESS_MAP[key]] = PropertyMaps.propertyFormatter(key, locationAddress[key]);
                } else {
                    companyUpdateData.properties[PropertyMaps.LOCATION_ADDRESS_MAP[key]] = '';
                }
            }
        }

        const mailingAddress = npiData.addresses.find(a => {
            return a.address_purpose == 'MAILING';
        })
        if(mailingAddress) {
            for(const key in PropertyMaps.MAILING_ADDRESS_MAP) {
                if(mailingAddress[key]) {
                    companyUpdateData.properties[PropertyMaps.MAILING_ADDRESS_MAP[key]] = PropertyMaps.propertyFormatter(key, mailingAddress[key]);
                } else {
                    companyUpdateData.properties[PropertyMaps.MAILING_ADDRESS_MAP[key]] = '';
                }
            }
        }
    }

    if(npiData.practiceLocations && npiData.practiceLocations.length > 0) {
        let practiceLocationString = '';
        for(let i = 0; i < npiData.practiceLocations.length; i++) {
            const location = npiData.practiceLocations[i];
            for(const key in PropertyMaps.LOCATION_ADDRESS_MAP) {
                if(location[key]) {
                    practiceLocationString += location[key] + ' ';
                }
            }
            if(i < npiData.practiceLocations.length - 1) {
                practiceLocationString += '\n\n';
            }
        }
        companyUpdateData.properties['manobyte_npi_practice_locations'] = practiceLocationString;
    }

    if(npiData.taxonomies && npiData.taxonomies.length > 0) {
        let taxonomiesString = '';
        const primaryTaxonomy = npiData.taxonomies.find(t => {
            return t.primary
        })
        if(primaryTaxonomy) {
            for(const key of PropertyMaps.TAXONOMY_FIELDS) {
                if(primaryTaxonomy[key]) {
                    taxonomiesString += primaryTaxonomy[key] + ' ';
                }
            }
        }
        const nonPrimaryTaxonomies = npiData.taxonomies.filter(t => {
            return !t.primary
        })
        for(let i = 0; i < nonPrimaryTaxonomies.length; i++) {
            const taxonomy = nonPrimaryTaxonomies[i];
            taxonomiesString += '\n\n';
            for(const key of PropertyMaps.TAXONOMY_FIELDS) {
                if(taxonomy[key]) {
                    taxonomiesString += taxonomy[key] + ' ';
                }
            }
        }

        companyUpdateData.properties['manobyte_npi_taxonomies'] = taxonomiesString;
    }

    if(npiData.identifiers && npiData.identifiers.length > 0) {
        let identifiersString = '';
        for(let i = 0; i < npiData.identifiers.length; i++) {
            const identifier = npiData.identifiers[i];
            if(i > 0) {
                identifiersString += '\n\n';
            }
            for(const key of PropertyMaps.IDENTIFIER_FIELDS) {
                if(identifier[key]) {
                    identifiersString += identifier[key] + ' ';
                }
            }
        }

        companyUpdateData.properties['manobyte_npi_identifiers'] = identifiersString;
    }

    if(npiData.endpoints && npiData.endpoints.length > 0) {
        let endpointsString = '';
        for(let i = 0; i < npiData.endpoints.length; i++) {
            const endpoint = npiData.endpoints[i];
            if(i > 0) {
                endpointsString += '\n\n';
            }
            for(let j = 0; j < PropertyMaps.ENDPOINT_FIELDS.length; j++) {
                const key = PropertyMaps.ENDPOINT_FIELDS[j];
                if(endpoint[key]) {
                    endpointsString += endpoint[key];
                }
                if(j < 3) {
                    endpointsString += '\n';
                } else {
                    endpointsString += ' ';
                }
            }
        }

        companyUpdateData.properties['manobyte_npi_endpoints'] = endpointsString;
    }

    if(npiData.other_names && npiData.other_names.length > 0) {
        let otherNamesString = '';
        for(let i = 0; i < npiData.other_names.length; i++) {
            const name = npiData.other_names[i];
            if(i > 0) {
                otherNamesString += '\n\n';
            }
            for(const key of PropertyMaps.COMPANY_OTHER_NAME_FIELDS) {
                if(name[key] && name[key] != '--') {
                    otherNamesString += name[key] + ' ';
                }
                if(key == 'type') {
                    otherNamesString += '\n';
                }
            }
        }

        companyUpdateData.properties['manobyte_npi_other_names'] = otherNamesString;
    }

    await Utils.request('patch', `${Utils.HS_API_BASE}/crm/v3/objects/company/${queueItem.objectId}`, hsHeaders, true, companyUpdateData)
        .catch(e => {
            console.log(e?.response?.data || e);
        })
}


module.exports = router;