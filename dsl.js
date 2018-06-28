'use strict';
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const padStart = require('string.prototype.padstart');
padStart.shim();

let callback = function (error, user, context) {
    if (error) {
        console.error(error);
    }
    if (user) {
        console.log('User', user);
    }
    if (context) {
        console.log('Context', context);
    }
};

let ruleAsFunction = function(dirname, ruleFileName) {
    let rawRule = fs.readFileSync(path.join(dirname, ruleFileName), {encoding: 'utf-8'});
    let wrappedFunction = Function(`"use strict"; return ` + rawRule);
    return wrappedFunction();
};

let getAccessToken = function(auth0TenantDns, clientID, clientSecret) {
    let clientCreds = {
        grant_type: 'client_credentials',
        client_id: clientID,
        client_secret : clientSecret,
        audience: `https://${auth0TenantDns}/api/v2/`
    };
    let tokenEndpoint = `https://${auth0TenantDns}/oauth/token`;
    
    return axios.post(tokenEndpoint, clientCreds)
        .then(function(response) {
            return response.data.access_token;
        });
};

let createRawRulesFileName = function(dirname, auth0TenantDns) {
    return path.join(__dirname, `${auth0TenantDns}.raw-rules.js`);
};

let createSortableRuleFileName = function(rule) {
    return `${(rule.order + '').padStart(2, '0')}-${rule.name}.js`;
};

let executeRule = function(dirname, ruleFileName, user, context, callback) {
    let ruleFn = ruleAsFunction(dirname, ruleFileName);
    ruleFn(user, context, callback || function() {});
};

exports.callback = callback;
exports.ruleAsFunction = ruleAsFunction;
exports.getAccessToken = getAccessToken;
exports.createRawRulesFileName = createRawRulesFileName;
exports.createSortableRuleFileName = createSortableRuleFileName;
exports.executeRule = executeRule;
exports.user = {};
exports.context = {
    clientName: 'SharePoint 2016 SharedPain Application'
};

