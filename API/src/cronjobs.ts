import Utils from'./utils';
import sql from 'mssql';
import fs from 'fs';
import path from 'path';
const cron = require('node-cron');

const stripe = require('stripe')(Utils.STRIPE_API_KEY);

async function checkSubscriptions() {
    await Utils.DB_POOL
        .then(async pool => {
            try {
                const trialMS = 3600000 * 24 * 7; // Last digit is days
                const currentTimestamp = + new Date();
                let result = await new sql.Request(pool)
                    .query('SELECT * FROM tblPortalTokens WHERE (AlwaysActive IS null OR AlwaysActive = 0) AND IsActive = 1');
                for(let i = 0; i < result.recordset.length; i++) {
                    if(result.recordset[i].InstallTime) {
                        const endOfTrial = new Date(result.recordset[i].InstallTime).getTime() + trialMS;
                        // In trial, leave active
                        if(currentTimestamp < endOfTrial) {
                            continue;
                        }
                    }
                    let isActive = true;
                    if(!result.recordset[i].SubscriptionId){
                        isActive = false;
                    } else {
                        await stripe.subscriptions.retrieve(result.recordset[i].SubscriptionId)
                            .then(result => {
                                if(result.status != 'active' && result.status != 'past_due') {
                                    isActive = false;
                                }
                            })
                            .catch(err => {
                                if(err?.raw?.code && err.raw.code == 'resource_missing'){
                                    isActive = false;
                                }
                            });
                    }
                    
                    if(!isActive) {
                        try {
                            await new sql.Request(pool)
                                .input('HSPortalId', result.recordset[i].HSPortalId)
                                .query('UPDATE tblPortalTokens SET IsActive = 0, SubscriptionId = null WHERE HSPortalId = @HSPortalId');
                        } catch(e) {
                            console.log(e);
                        }                                      
                    }
                }
            } catch(e) { }
        })
        .catch(e => {
            console.log(e);
        })
}

cron.schedule("0 0 */4 * * *", async () => {
    await checkSubscriptions().catch(() => {});
});