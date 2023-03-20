require('dotenv').config({ path: __dirname+'/.env' });
const jwt = require('jsonwebtoken');
const constants = require('./constants');

const privateKey = process.env.JWT_SECRET_KEY;

module.exports.generateToken = function generateToken(input) {
    try {
        const token = jwt.sign(input, privateKey);
        return token;
    } catch (error) {
        console.log("Error generating token: "+error);
        return "";
    }
    
}

module.exports.authenticateToken = function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log("incoming request: /authenticateToken : token: "+token);


    if(token == null) res.sendStatus(constants.TOKEN_NOT_IN_REQUEST);

    jwt.verify(token, privateKey, (err, data) => {
        if(err) {
            console.log("error verifying token: ", err);
            res.sendStatus(constants.TOKEN_AUTHENTICATION_FAILED);
        } 
        else if(data == null) res.sendStatus(constants.TOKEN_AUTHENTICATION_FAILED);

        else if(next == null) {
            res.status(constants.TOKEN_VERIFIED).json({
                userName: data.userName
            });
        }

        else {
            req.userName = data.userName;
            next();
        }
    })
}