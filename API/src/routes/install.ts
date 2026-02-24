import Utils from'../utils';
import PropertyMaps from '../propertymaps';
import express from 'express';
const router = express.Router();

router.get('/properties', Utils.asyncHandler(async (req, res) => {
    // contact
    let accessToken;
    try {
        accessToken = await Utils.getHSAccessToken(req.session.portalId)
    } catch(e) {
        console.log(e);
        res.status(500).send();
        return;
    }
    const hsHeaders = Utils.getHSHeaders(accessToken);
    const propertyGroupData = {
        name: 'manobyte_npi',
        label: 'NPI - ManoByte'
    }
    await Utils.request('post', `${Utils.HS_API_BASE}/crm/v3/properties/contact/groups`, hsHeaders, true, propertyGroupData)
        .catch(e => {
            console.log(e?.response?.data || e);
        })
    await Utils.request('post', `${Utils.HS_API_BASE}/crm/v3/properties/company/groups`, hsHeaders, true, propertyGroupData)
        .catch(e => {
            console.log(e?.response?.data || e);
        })

    const contactPropertyData = {
        inputs: PropertyMaps.PROPERTIES.filter(p => { return p.isContact })
    }
    const companyPropertyData = {
        inputs: PropertyMaps.PROPERTIES.filter(p => { return p.isCompany })
    }

    let error;

    await Utils.request('post', `${Utils.HS_API_BASE}/crm/v3/properties/contact/batch/create`, hsHeaders, true, contactPropertyData)
        .catch(e => {
            console.log(e?.response?.data || e);
            error = e?.response?.data || e;
        })
    await Utils.request('post', `${Utils.HS_API_BASE}/crm/v3/properties/company/batch/create`, hsHeaders, true, companyPropertyData)
        .catch(e => {
            console.log(e?.response?.data || e);
            error = e?.response?.data || e;
        })

    if(error) {
        res.status(500).send(error)
    } else {
        res.send();
    }
}))

module.exports = router;