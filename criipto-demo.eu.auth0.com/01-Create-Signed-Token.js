function (user, context, callback) {
  let isNode8 = function () {
    console.log(process.version);
    return process.version && process.version.startsWith('v8');
  };

  let setJwtExpiry = function (options, minutes) {
    if (isNode8()) {
      options.expiresIn = '' + minutes + 'm';
    }
    else {
      options.expiresInMinutes = minutes;
    }
  };

  if (context.clientName.search("SharePoint") === 0) {

    var CLIENT_ID = configuration.clientID;
    var CLIENT_SECRET = configuration.clientSecret;
    var ISSUER = configuration.issuer;

    var options = {
      subject: user.user_id,
      audience: CLIENT_ID,
      issuer: ISSUER
    };
    setJwtExpiry(options, 25);

    var api_user = {
      user_id: user.user_id,
      email: user.email,
      name: user.name
    };

    user.id_token = jwt.sign(api_user,
      new Buffer(CLIENT_SECRET, 'base64'),
      options);
  }
  callback(null, user, context);
}