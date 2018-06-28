[
  {
    "id": "rul_ySlsn9iXLTdIKU9d",
    "enabled": true,
    "script": "function (user, context, callback) {\n  if (context.clientName.search(\"SharePoint\") === 0) {\n    \n    var CLIENT_ID = configuration.clientID;\n    var CLIENT_SECRET = configuration.clientSecret;\n    var ISSUER = configuration.issuer;\n    \n    var options = {\n      subject: user.user_id,\n      audience: CLIENT_ID,\n      issuer: ISSUER,\n      expiresInMinutes: 25\n    };\n\n    var api_user = {\n      user_id: user.user_id,\n      email: user.email,\n      name: user.name\n    };\n\n    user.id_token = jwt.sign(api_user, \n      new Buffer(CLIENT_SECRET, 'base64'),\n      options);\n  }\n  callback(null, user, context);\n}",
    "name": "Create-Signed-Token",
    "order": 1,
    "stage": "login_success"
  }
]