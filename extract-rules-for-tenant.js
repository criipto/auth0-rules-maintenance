'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const {createRawRulesFileName, createSortableRuleFileName} = require('./dsl');

let auth0TenantDns = process.env.TENANTDNS;

let rawRulesFile = createRawRulesFileName(__dirname, auth0TenantDns);
let rawRules = fs.readFileSync(rawRulesFile);
let rules = JSON.parse(rawRules);
let sortedRules = _.sortBy(rules, function(rule) {
    return rule.order;
});

let targetDirectory = path.join(__dirname, auth0TenantDns);
fs.mkdir(targetDirectory, function(err) {
    if (err && err.code !== 'EEXIST') {
        throw(err);
    }
    _.each(sortedRules, function(rule) {
        let ruleFileName = createSortableRuleFileName(rule);
        let sortableName = path.join(targetDirectory, ruleFileName);
        fs.writeFileSync(sortableName, rule.script);
    });   
});
