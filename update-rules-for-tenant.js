'use strict';

const fs = require('fs');
const _ = require('lodash');
const axios = require('axios');
const path = require('path');
const {getAccessToken, createRawRulesFileName, createSortableRuleFileName} = require('./dsl');

let auth0TenantDns = process.env.TENANTDNS;
let clientID = process.env.CLIENTID;
let clientSecret = process.env.CLIENTSECRET;

getAccessToken(auth0TenantDns, clientID, clientSecret).then(function(tenantToken) {
    let rawRulesFile = createRawRulesFileName(__dirname, auth0TenantDns);
    let rawdata = fs.readFileSync(rawRulesFile);
    let rules = JSON.parse(rawdata);
    let sortedRules = _.sortBy(rules, function(rule) {
        return rule.order;
    });    

    let sourceDirectory = path.join(__dirname, auth0TenantDns);
    _.each(sortedRules, function(rule) {
        let ruleFileName = createSortableRuleFileName(rule);
        var sortableName = path.join(sourceDirectory, ruleFileName);
        let currentRuleScript = fs.readFileSync(sortableName, {encoding: 'utf-8'});
        let newRule = {
            script : currentRuleScript,
            order: rule.order,
            enabled : rule.enabled,
            name: rule.name
        }
        
        let updateRuleUrl = `https://${auth0TenantDns}/api/v2/rules/${rule.id}`;
        let options = { headers : { Authorization: `Bearer ${tenantToken}`} };
        axios
            .patch(updateRuleUrl, newRule, options)
            .then(function() {
                console.log(`Patched rule ${rule.name} (order: ${rule.order}, id: ${rule.id}`)
            })
            .catch(function (error) {
                console.error(`Failed to patch rule ${rule.name} (order: ${rule.order}, id: ${rule.id}`);
                let data = ((error || {}).response || {}).data
                console.error(data || error);
            });
    });
}).catch(function(error) {
    console.error(`Failed to get an access token from the Auth0 tenant ${auth0TenantDns}`);
    let data = ((error || {}).response || {}).data
    console.error(data || error);
});