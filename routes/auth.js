const express = require('express');
const router = express.Router();
const gateway = require('../middlewares/gateway');


router.get('/getIdToken', (req, res, next) => {
    try {
        res.redirect('https://login.microsoftonline.com/' + process.env.tenant + '/oauth2/v2.0/authorize?' + 
                     'client_id=' + process.env.clientid + 
                     '&response_type=id_token' + 
                     '&redirect_uri=' + process.env.domain + '/auth/jwt' +
                     '&scope=openid profile' + 
                     '&response_mode=form_post' +
                     '&state=12345' + 
                     '&nonce=678910');
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
});


/**
 * 
 */
router.post('/jwt', async (req, res, next) => {
    try {
        const obj = await JSON.parse(JSON.stringify(req.body));
        const validUser = await gateway.validateJwt(obj.id_token);
        if (validUser.status) {
            res.redirect(process.env.domain + '/auth/getAccessCode');
        }
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
})


router.get('/getAccessCode', (req, res, next) => {
    try {
        res.redirect('https://login.microsoftonline.com/' + process.env.tenant + '/oauth2/v2.0/authorize?' + 
                     'client_id=' + process.env.clientid + 
                     '&response_type=code' + 
                     '&redirect_uri=' + process.env.testdomain +
                     '&scope=openid profile https://management.azure.com//.default' + 
                     '&response_mode=query' +
                     '&state=12345');
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
})


router.get('/getAccessToken', async (req, res, next) => {
    try {
        const result = await gateway.requestAccessToken(req);
        return res.send(result);
    } catch (e) {
        return res.status(400).json({ status: 400, message: e.message });
    }
})

module.exports = router;