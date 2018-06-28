# Tools for working with _private rules_ in Auth0 tenants

_{private rules: Auth0 rules that you cannot, for some reason or the other, keep in a public GitHub repository}_

First, we would like to point your attention to the [GitHub Deploy Extension](https://auth0.com/docs/extensions/github-deploy). That extension comes with more features than what you will find in this repository, and has a nice UI to go along with it. After evaluating that option, however, you may have concluded that handing out a personal access token with `repo` scope is not viable for your scenario, or that you cannot or will not use an extension for this type of work. That leaves you with the option of maintaining your rules pipeline via the Auth0 management UI - which bring us to the topic of motivating the existence of this repository:

*Raison d'être*: In our experience, the management UI in Auth0 is not very well suited for working with complex rules - and especially so when the pipeline has more than 1 rule. Cross-rule search is not supported, and neither is refactoring nor any form of testing without actually changing the pipeline implementation on your runtime system. These factors has motivated us to create a few Node-scripts that help automate a workflow where you can maintain your rules locally, and get to use your favorite JavaScript editor while doing so.

The scripts here work with a 1-to-1 representation of the format that the rules have natively in Auth0. As these are just raw, anonymous functions, a bit of infrastructure has been added to this repo to be able to work effectively with the native rules format. For example, the native format makes `require(...)` useless for loading the rules implementations - instead, specs can use the `ruleAsFunction` function in the [DSL](dsl.js) module to load a rule as an executable JavaScript `Function` instance.

## <a name="Prerequisites"></a>Prerequisites
Your tenant needs to have a <a name="MaintenanceApp"></a>Machine-to-Machine application with access to the Auth0 management API. For the scripts in this repo, `read:rules` (used by the [Fetch Rules](fetch-rules-for-tenant.js) script) and `update:rules` (used by the [Update Rules](update-rules-for-tenant.js) script) are required. We usually name this application _Rules Pipeline Maintenance_, and will use this name to refer to this application below.

You will need a couple of configuration values from the _Rules Pipeline Maintenance_ application to run some of the scripts. The relevant values are created automatically when you create the application - specifically, you need the values of the `Client ID` and the `Client Secret`. We use the placeholder values `<CLIENTID>` and `<CLIENTSECRET>` below when referring to these values in the examples.

We also use the placeholder value `<TENANTDNS>` when talking about the DNS name of your Auth0 tenant.

Node.js must be installed locally - and you may have to run `npm install` from time to time.

## Management Scripts Execution
The management scripts can be executed via Node.js. They use environment variables to get at the relevant settings for connection to your Auth0 tenant(s). Depending on the script, some or all of the following environment variables must be set prior to execution:
 - `TENANTDNS`
 - `CLIENTID`
 - `CLIENTSECRET`

 \- see below for per-script requirements.

### <a name="FetchRulesScript"></a>Fetch Rules Script
Usage:
```
TENANTDNS=<TENANTDNS> CLIENTID=<CLIENTID> CLIENTSECRET=<CLIENTSECRET> node fetch-rules-for-tenant.js
```
The script creates (or updates) a file with a raw dump of all of the rules returned by Auth0's management API. 
This file serves as a whitelist for both the extract and the update scripts (described below).

The generated 'raw dump' file can be very useful for rollback-scenarios: If, after the [Update Rules Script](#UpdateRulesScript) has been run, it is found that the rules pipeline has been broken, the 'previous' version of this file can be used to re-run first the [Extract Rules Script](#ExtractRulesScript) - which will overwrite the local copy of the rules files, and then the [Update Rules Script](#UpdateRulesScript), which will push the now-overwritten rules files to the Auth0 tenant, effectively re-installing the previous rules pipeline.

### <a name="ExtractRulesScript"></a>Extract Rules Script
Usage:
```
TENANTDNS=<TENANTDNS> node extract-rules-for-tenant.js
```
First thing to note: This script _WILL OVERWRITE_ each and any local copy of matching rules files in the repo. Its purpose is to make it easy to get going working with the individual rules in a new tenant.

Second thing to note: This script does not connect to your Auth0 tenant, but works exclusively on the already-downloaded 'raw dump' file for your tenant.

The script uses a local folder with the same name as the specified `TENANTDNS` value as the target for the extracted rules - the filenames are created so the lexiographical sorting of the filenames matches the sequence in the Auth0 UI.

### <a name="UpdateRulesScript"></a>Update Rules Script
Usage:
```
TENANTDNS=<TENANTDNS> CLIENTID=<CLIENTID> CLIENTSECRET=<CLIENTSECRET> node update-rules-for-tenant.js
```
When you are done with your local changes, this script can be used to update the corresponding rules in the Auth0 tenant.
Note again that only local rules files explicitly mentioned in the 'raw dump' file (from the [Fetch Rules Script](#FetchRulesScript)) will be updated in the Auth0 tenant.

## Testing
Alongside the extracted rules files, you can add as many test-harnesses as you like, and set them up to work with your favorite testing tools. We like to use a convention where the test-file name has matching prefix to the rule under test, but with a `.spec.js` extension - see the [Create Signed Token](criipto-demo.eu.auth0.com/01-Create-Signed-Token.spec.js) test harness file. These test harnesses can be executed via Node.js - example:
```
node criipto-demo.eu.auth0.com/01-Create-Signed-Token.spec.js
```
In some cases, all you need is a smoke-test harness (such as for testing that a Node 4 -> Node 8 migration does not cause your rules pipeline to explode due to the breaking changes that go along with a major version change). In other scenarios, you may want to use a more unit-testing-like approach. Both scenarios are supported here, but it is up to you to make the choices.

> It is safe to add non-rules to the tenant directory, as these are _NOT_ listed in the 'raw dump' file extracted from Auth0 - and will thus not be picked up by the [Update Rules Script](#UpdateRulesScript).

## Editors

### VS Code
Has good JS code navigation support (`Find All References` from the context menu works well)!

You may want to disable the default TypeScript validation engine - it is _not_ happy about anonymous functions in .js files. This can be done from the User Settings dialog (`CTRL + SHIFT + P`, type _User Settings_ and hit `ENTER` on Windows), by adding the following line `"typescript.validate.enable": false` to the diplayed JSON structure (the one with your user-settings).

## Sample
For this example, we use `<TENANTDNS>` = `criipto-demo.eu.auth0.com` - replace this with your own tenant DNS if you want to run the scripts while following along.

This sample illustrates how we used these tools to handle a major version upgrade of the Node.js runtime in Auth0 (4 to 8) - which introduced some breaking changes, as the availabe Node-modules were also upgraded. Details are available in Auth0's documentation on the [Affected Modules](https://auth0.com/docs/migrations/guides/extensibility-node8#affected-modules), should you want to check your own module usage for potential impact.

The sample contains a slightly simplified version of a rule present in several of our production pipelines, which was hit by one of these breaking changes. Specifically, the rule uses a function from the `jsonwebtoken` module - which had its version bumped from `0.4.1` to `7.4.1`.

The breaking change that hit us was in the `sign` function - where a property on one of the function arguments had been renamed, and its type had been changed as well. In `0.4.1`, the property is called `expiresInMinutes` and is a `Number`, while in `7.4.1`, the property is called `expiresIn` and is a `String`.

In order to test this, it is necessary to be able to switch back-and-forth between Node versions. Doing that on a running system in production is not something we would want to expose our customers to, so we started by setting up a local development environment side-by-side installations of Node.js versions (we use `nvm` to handle this, but YMMV ofc).

Next, the [Fetch Rules Script](#FetchRulesScript) could be used to get a raw dump of the current state of affairs for a tenant pipeline:
```
TENANTDNS=criipto-demo.eu.auth0.com CLIENTID=<CLIENTID> CLIENTSECRET=<CLIENTSECRET> node fetch-rules-for-tenant.js
```
 \- which would create a file called `criipto-demo.eu.auth0.com.raw-rules.js` ([see it here](criipto-demo.eu.auth0.com.raw-rules.js)) in the working directory. Except, of course, that you cannot access our demo tenant - so we have included a raw dump file from our tenant, with a Node 4-specific implementation of the rule.
 
 > Remember to use the values of `<CLIENTID>` and `<CLIENTSECRET>` from your own tenants [_Rules Pipeline Maintenance_](#MaintenanceApp) application, and your own Auth0 tenants DNS name if you want to try this step yourself.

After that, the [Extract Rules Script](#ExtractRulesScript) is used to pull out the rule to a workable format:
```
TENANTDNS=criipto-demo.eu.auth0.com node extract-rules-for-tenant.js
```

> When you run this locally, it will overwrite the version of the [rule file](criipto-demo.eu.auth0.com/01-Create-Signed-Token.js) contained in the repo (which comes with a reworked, Node-version aware implementation) - you can always use `git checkout criipto-demo.eu.auth0.com/` to get back to the initial state. But if you run the [Extract Rules Script](#ExtractRulesScript) now, you can see the 'original' implementation and compare it to the 'final' variant with your favorite Git-diff tool. Incidentally, this also demonstrates how you could go about having a workflow where you use the raw dump file as a local backup until you are satisfied with the changes you need to make to your rules: Only run the [Fetch Rules Script](#FetchRulesScript) initially, and then again when you have verified the effect of running the [Update Rules Script](#UpdateRulesScript) on your tenant.

Then, you need to install the version of the `jsonwebtoken` package that matches the Node 4 engine in Auth0: 
```
npm install jsonwebtoken@0.4.1
```

And then, finally, you can run the included [Smoke Test](criipto-demo.eu.auth0.com/01-Create-Signed-Token.spec.js) like so:
```
node criipto-demo.eu.auth0.com/01-Create-Signed-Token.spec.js
```
 \- check that it runs without exceptions, and outputs a `user` with an `id_token` property on the console. The value of the `id_token` property is a base64-encoded Json Web Token, which you can drill into using [JWT.io](https://jwt.io), if you would like to see some details.

Now, to investigate if the rule is hit by any breaking changes, switch to a local Node.js installation in major version 8, install the target version of the `jsonwebtoken` module,
```
npm install jsonwebtoken
```
execute the [Smoke Test](criipto-demo.eu.auth0.com/01-Create-Signed-Token.spec.js) again,
```
node criipto-demo.eu.auth0.com/01-Create-Signed-Token.spec.js
```
and observe an exception being logged on the console. There will be a line containing a `ValidationError: "expiresInMinutes" is not allowed` message.

So - the conclusion is that the rule implementation needs to be changed before it will work with Node 8. You can go several ways here. For us, it is crucial to handle this transition as smoothly as possible, so we choose a strategy that lets our pipeline handle both versions of Node simultaneously. That will let us update the rules while still running on v4, and then switch to v8 once we are confident that the v4 version is still stable. The only change needed to get to v8 is then to flip a switch in Auth0 - no need to redeploy rules if a rollback to v4 must be done.

To keep this sample as simple as possible, we implement the needed change directly in the rule - in more complex cases, we would go with having a dedicated rule in the pipeline that defines version-aware functions where needed (they can be attached to and accessed via the `context` instance given to the rules at runtime).

You can get the reworked rule if you run a 
```
git checkout criipto-demo.eu.auth.com/
```
now, and that will also let you run the [Smoke Test](criipto-demo.eu.auth0.com/01-Create-Signed-Token.spec.js) again - and verify that the exception is now gone.
You can then swap back Node 4, and re-run the [Smoke Test](criipto-demo.eu.auth0.com/01-Create-Signed-Token.spec.js), to make sure we have not broken the v4 implementation. Just remember to switch to the matching version of `jsonwebtoken` after switching Node version.

