import Utils from'../utils';
import express from 'express';
const router = express.Router();
import axios from 'axios';
import sql from 'mssql';
const querystring = require('querystring');
const apiUrl = Utils.API_URL;

const CLIENT_ID = Utils.HS_CLIENT_ID;
const CLIENT_SECRET = Utils.HS_CLIENT_SECRET;
let SCOPES = 'oauth crm.objects.companies.read crm.objects.companies.write crm.objects.contacts.read crm.objects.contacts.write crm.schemas.companies.read crm.schemas.companies.write crm.schemas.contacts.read crm.schemas.contacts.write';
const REDIRECT_URI = apiUrl + '/oauth/oauth-callback';

const authUrl =
  'https://app.hubspot.com/oauth/authorize' +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` + // app's client ID
  `&scope=${encodeURIComponent(SCOPES)}` + // scopes being requested by the app
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`; // where to send the user after the consent page 

// Redirect the user from the installation page to
// the authorization URL
router.get('/', (req, res) => {
  console.log('');
  console.log('=== Initiating OAuth 2.0 flow with HubSpot ===');
  console.log('');
  console.log("===> Step 1: Redirecting user to your app's OAuth URL");
  console.log(authUrl);
  res.redirect(authUrl);
  console.log('===> Step 2: User is being prompted for consent by HubSpot');
});

// Step 2
// The user is prompted to give the app access to the requested
// resources. This is all done by HubSpot, so no work is necessary
// on the app's end

// Step 3
// Receive the authorization code from the OAuth 2.0 Server,
// and process it based on the query parameters that are passed
router.get('/oauth-callback', Utils.asyncHandler(async (req, res) => {
  console.log('===> Step 3: Handling the request sent by the server');

  // Received a user authorization code, so now combine that with the other
  // required values and exchange both for an access token and a refresh token
  if (req.query.code) {
    console.log('       > Received an authorization token');

    const authCodeProof = {
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code: req.query.code
    };

    // Step 4
    // Exchange the authorization code for an access token and refresh token
    console.log('===> Step 4: Exchanging authorization code for an access token and refresh token');
    const tokens = await exchangeForTokens(authCodeProof, req);
    if (tokens.ErrorMessage) {
      console.log(tokens.ErrorMessage);
      return res.redirect(apiUrl);
    }

    // Once the tokens have been retrieved, use them to make a query
    // to the HubSpot API
    res.redirect(apiUrl);
  }
}));

//==========================================//
//   Exchanging Proof for an Access Token   //
//==========================================//


const getPortalId = async (refreshToken) => {
  console.log('');
  console.log('=== Retrieving Portal Id ===');
  const result = await axios.get('https://api.hubapi.com/oauth/v1/refresh-tokens/' + refreshToken);
  return result.data.hub_id;
};

const exchangeForTokens = async (exchangeProof, req) => {
  const postData = querystring.stringify(exchangeProof);
    try {
      const responseBody = await axios.post('https://api.hubapi.com/oauth/v1/token?', postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
        });
        const tokens = responseBody.data;
        console.log("REFRESH: " + tokens.refresh_token);
        console.log("ACCESS: " + tokens.access_token); 
        console.log('       > Received an access token and refresh token');
        let portalId;
        await getPortalId(tokens.refresh_token)
          .then(resp => {
            portalId = resp;
          });
        req.session.portalId = portalId;

        Utils.DB_POOL
          .then(async pool => {
              new sql.Request(pool)
                  .input('HSPortalId', portalId)
                  .input('RefreshToken', tokens.refresh_token)
                  .input('AccessToken', Utils.encrypt(tokens.access_token))
                  .input('Expires', ((+ new Date()) + (tokens.expires_in * 1000) - 3600000))
                  .execute('prcAddTokens')
                  .catch(e => {
                    console.log(e);
                  });
          })
          .catch(e => {
            console.log(e);
          });
        
        return { AccessToken: tokens.access_token, PortalId: portalId };
    } catch (e) {
      console.log(e);
      console.error(`       > Error exchanging ${exchangeProof.grant_type} for access token`);
      return { ErrorMessage: `Error exchanging ${exchangeProof.grant_type} for access token, please try again or contact us at justin@manobyte.com` };
    }
  };

module.exports = router;