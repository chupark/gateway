const request = require('request');
const jwt = require('jsonwebtoken');
const NodeRSA = require('node-rsa');
let result = {
    status : true,
    message : 'message'
};

module.exports = {
    callTenantRSA: async function (req) {
        try {
            function doRequest() {
                return new Promise (function (resolve, reject) {
                    request({
                        uri: 'https://login.microsoftonline.com/' + process.env.tenant + '/discovery/keys',
                        method: "GET",
                        json: true
                    }, function (error, res, data) {
                        if (!error) {
                            resolve(data);
                          } else {
                            reject(error);
                          }
                        //console.log(aaa);
                    });
                });
            }
            const rsa = await doRequest();
            return rsa;
        } catch (e) {
            console.log(e);
        }
    },

    validateJwt: async function (str, code) {
        try {
            const key = '-----BEGIN CERTIFICATE-----\n' + process.env.rsa + '\n-----END CERTIFICATE-----'
            const obj = JSON.parse(JSON.stringify(jwt.verify(str, key)));
            const regex = /.[com|net]\/([a-zA-Z0-9-]{0,60})/
            if (obj.iss.match(regex)[1] == obj.tid) {
                console.log(true);
            } else {
                console.log('not matched iss and tid')
            }
            
            if (str) {
                console.log('idToken');
                return result;
            }
        } catch (e) {
            console.log(e);
            result.status = false;
            result.message = e.name
            if (e.name == 'TokenExpiredError') {
                
            }
            return result;
        }
    },

    requestAccessToken: async function(req) {
        try {
            function doRequest(req) {
                return new Promise (function (resolve, reject) {
                    request({
                        uri: 'https://login.microsoftonline.com/' + process.env.tenant + '/oauth2/v2.0/token',
                        method: "POST",
                        form: {
                            'client_id': process.env.clientid,
                            "grant_type": "authorization_code",
                            'scope': 'https://management.azure.com//.default openid offline_access',
                            'code': req.query.code,
                            'redirect_uri': process.env.testdomain,
                            'client_secret': process.env.password
                        },
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        json: true
                    }, function (error, res, data) {
                        if (!error) {
                            console.log(data);
                            resolve(data);
                          } else {
                            reject(error);
                          }
                        //console.log(aaa);
                    });
                });
            };
            const reqBearer = await doRequest(req);
            const rsaKey = new NodeRSA(process.env.privateKey.toString());
            reqBearer.id_token = rsaKey.encrypt(reqBearer.id_token, 'base64');
            reqBearer.refresh_token = rsaKey.encrypt(reqBearer.refresh_token, 'base64');
            reqBearer.access_token = rsaKey.encrypt(reqBearer.access_token, 'base64');
            //reqBearer.access_token = 'abcdef';
            return reqBearer;
        } catch (e) {
            console.log(e);
            return false;
        }
    }
}