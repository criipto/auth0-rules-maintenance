'use strict';

const fs = require('fs');
const axios = require('axios');
const _ = require('lodash');

const {getAccessToken, createRawRulesFileName, createSortableRuleFileName} = require('./dsl');

let auth0TenantDns = process.env.TENANTDNS;
let clientID = process.env.CLIENTID;
let clientSecret = process.env.CLIENTSECRET;

getAccessToken(auth0TenantDns, clientID, clientSecret).then(function(tenantToken) {
    let options = { headers : { Authorization: `Bearer ${tenantToken}`} };
    axios.get(`https://${auth0TenantDns}/api/v2/rules`, options).then(function(response) {
        let rules = response.data;
        let rawRulesFile = createRawRulesFileName(__dirname, auth0TenantDns);
        let prettyRawRules = JSON.stringify(rules, null, 2);
        fs.writeFileSync(rawRulesFile, prettyRawRules);
    });
});
