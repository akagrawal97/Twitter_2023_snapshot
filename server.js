const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');

const authService = require('./authService');
const userRoute = require('./routes/UserRoute');
const tweetRoute = require('./routes/TweetRoute');
const constants = require('./constants');
require('dotenv').config({ path: __dirname+'/.env' });

const app = express();

const PORT = process.env.PORT || 8090;

app.use(cors({ origin: '*'}));   
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

app.get('/', (req, res) => {
    console.log(req.ip);
    res.sendFile(__dirname+'/example.html');
});

app.get('/ping', (req, res) => {
    res.status(200).send("Your ip address: "+req.ip);
})

app.get('/authenticateToken', (req, res) => {
    authService.authenticateToken(req, res);
})

app.use('/user', userRoute);
app.use('/tweet', tweetRoute);

app.listen(PORT, async (err) => {
    if(err) console.log(constants.ERROR_STARTING_SERVER);
    else console.log(constants.SERVER_STARTED, PORT);

    const dbUserName = process.env.DB_USER_NAME;
    const dbPassword = process.env.DB_PASSWORD;
    const dbClusterUrl = process.env.DB_CLUSTER_URL;

    try {
        const MONGO_CONNECTION_URL = `mongodb+srv://${dbUserName}:${dbPassword}@${dbClusterUrl}/Twitter_2023?retryWrites=true&w=majority`;
        console.log('MONGO_CONNECTION_URL', MONGO_CONNECTION_URL);
        mongoose.connect(MONGO_CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        const mongoConnection = mongoose.connection;
        mongoConnection.once('open', (err) => {
            if(err) console.log(constants.MONGODB_CONNECTION_FAILED, err);
            else console.log(constants.MONGODB_CONNECTION_ESTABLISHED);
        })
    } catch (err) {
        console.log(constants.MONGODB_CONNECTION_FAILED, err);
    }
});

