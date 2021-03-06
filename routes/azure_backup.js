var express = require('express');
var router = express.Router();
const NodeRSA = require('node-rsa');
const request = require('request-promise');
const gateway = require('../middlewares/gateway');

/* GET home page. */
router.all('/*', async function(req, res, next) {
//router.get('/^((?!auth).)*$/', async function(req, res, next) {
  try {
    // check url
    // for future, please use enum
    console.log(req.baseUrl);
    console.log(req.url);
    console.log(req.query);
    console.log('================= body ============');
    console.log(JSON.stringify(req.body, null, 2));
    //console.log(req);
    console.log('===================================');
    //console.log(req.header('authorize'));
    

    // Decrypt the Encrypted Authorize Bearer key
    const rsaKey = new NodeRSA(process.env.privateKey.toString());
    const decryptedAuthorization = rsaKey.decrypt(req.get('Authorization'), 'utf8');
    const decryptedCode = rsaKey.decrypt(req.get('Code'), 'utf8');
  
    // jwt Parsing
    //console.log(process.env.rsa);
    const validUser = await gateway.validateJwt(decryptedAuthorization, decryptedCode);

    // All validation job has finished
    if (validUser.status) {
      req.headers.authorization = ('Bearer ' + decryptedAuthorization);
      req.headers.code = decryptedCode;
      console.log(req.headers.authorization);
      //console.log(req.headers.Authorization);
      // Secondary Request to Backend Container
      try {
        // Real Request
        function doRequest(req) {
          return new Promise (function (resolve, reject) {
            if (req.method == 'GET') {
              // Not allow body to http method GET
              if(JSON.stringify(req.body).toString() == '{}') {
                request({
                  uri: 'http://127.0.0.1:3001' + req.baseUrl + req.url,
                  method: req.method,
                  json: true,
                  headers: req.headers
                }, function (error, res, data) {
                    if (!error) {
                        resolve(data);
                      } else {
                        console.log(error);
                        reject(error);
                      }
                    //console.log(aaa);
                });
              } else {
                return res.status(400).json({ status: 400, message: 'GET // Not allow Body'});
              }
            } else {
              console.log(req.body);
              request({
                uri: 'http://127.0.0.1:3001' + req.baseUrl + req.url,
                method: req.method,
                json: true,
                headers: req.headers,
                body: req.body
              }, function (error, res, data) {
                  if (!error) {
                      resolve(data);
                    } else {
                      console.log(error);
                      reject(error);
                    }
                  //console.log(aaa);
              });
            }
          });
        }
        const requestToContainer = await doRequest(req);
        console.log('=============================');
        console.log('call status : ', requestToContainer);
        return res.status(200).json({ status: 200, message: requestToContainer });
      } catch (e) {
          console.log(e);
          return res.status(200).json({ status: 400, message: e.message });
      }
    } else {
      if (!validUser.status) {
        return res.status(400).json({ status: 400, message: validUser.message});
      }
      return res.status(400).json({ status: 400, message: 'user not valid' });
    }
    
  } catch (e) {
    console.log(e);
    return res.status(400).json({ status: 400, message: e.message });
  }
});

module.exports = router;
