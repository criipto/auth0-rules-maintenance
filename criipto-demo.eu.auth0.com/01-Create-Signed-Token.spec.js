let {user, context, callback, ruleAsFunction} = require('../dsl');

global.jwt = require('jsonwebtoken');
global.configuration = {
  clientID: 'livinginabox',
  clientSecret: 'madeofcardboardandducttape',
  issuer : 'https://criipto-demo.eu.auth0.com'
}

let rule = ruleAsFunction(__dirname, './01-Create-Signed-Token.js');

rule(user, context, callback);