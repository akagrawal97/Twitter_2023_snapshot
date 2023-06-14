const constants = require('../constants');
const bcrypt = require('bcrypt');
const User = require('../models/UserModel');
const tweetService = require('./tweetService');
const authService = require('../authService');

module.exports.getProfileById = async(req, res) => {
    const queriedUserName = req.query.userName;
    if(queriedUserName == null) {
        res.sendStatus(constants.ERROR_PARAMETER_MISSING);
    }
    else {
        try {
            const queriedUser = await User.findOne({ userName: queriedUserName });
            if(queriedUser == null) {
                res.sendStatus(constants.NO_MATCH_FOUND_IN_DB);
            } 
            else {
                res.status(constants.SUCCESSFUL).json({
                    "name": queriedUser.name,
                    "userName": queriedUser.userName,
                    "tweets": queriedUser.tweets,
                    "connections": queriedUser.connections
                });
            }
        }
        catch(err) {
            console.log(constants.ERROR_FETCHING_USER, err);
            res.sendStatus(constants.ERROR_FETCHING_DB);
        }        
    }
}

module.exports.loginUser = async(req, res) => {
    const userName = req.body.userName;
    const password = req.body.password;
    console.log("POST /login : req: "+JSON.stringify(req.body));

    if(userName == null || password == null) {
        res.sendStatus(constants.MISSING_USERNAME_OR_PASSWORD);
    }
    else {
        try {
            const user = await User.findOne({ userName: userName });
            if(user == null) {
                console.log(constants.USER_NOT_FOUND);
                res.sendStatus(constants.NO_MATCH_FOUND_IN_DB);
            }
            else {
                if(bcrypt.compare(password, user.password)) {
                    console.log("password matched. generating token")
                    const userJwtToken = authService.generateToken({ userName: userName });
                    console.log("generated token: "+userJwtToken);
                    res.status(constants.SUCCESSFUL).json({ userJwtToken: userJwtToken });
                }
                else {
                    res.sendStatus(constants.WRONG_PASSWORD);
                }
            }
        } catch (err) {
            console.log(constants.ERROR_FETCHING_USER, err);
            res.sendStatus(constants.ERROR_FETCHING_DB);
        }
    }
}

module.exports.registerNewUser = async(req, res) => {
    console.log("POST /register , req: "+JSON.stringify(req.body));
    const userName = req.body.userName;
    const password = req.body.password;
    const name = req.body.name;

    if(userName == null || password == null || name == null) {
        res.sendStatus(constants.MISSING_USERNAME_OR_PASSWORD);
    }
    else {
        try {
            const user = await User.findOne({ userName: userName });
            if(user) {
                console.log(constants.USERNAME_ALREADY_EXISTS);
                res.sendStatus(constants.USERNAME_ALREADY_EXISTS);
            }
            else {
                const encryptedPassword = await bcrypt.hash(password, (Number)(process.env.SALT_ROUNDS));
                const selfConnection = [userName];
                const newUserModel = new User({
                    name: name,
                    userName: userName,
                    password: encryptedPassword,
                    connections: selfConnection
                });

                try {
                    const createdUser = await newUserModel.save();
                    if(createdUser) {
                        res.sendStatus(constants.USER_CREATED_SUCCESSFULLY);
                    }
                    else {
                        res.sendStatus(constants.USER_CREATION_FAILED);
                    }
                }
                catch(err) {
                    console.log(constants.ERROR_SAVING_USER, err);
                }
            }
        } catch (err) {
            console.log(constants.ERROR_FETCHING_USER, err);
            res.sendStatus(constants.ERROR_FETCHING_DB);
        }
    }
}

module.exports.getUserFeeds = async(req, res) => {
    console.log("GET /feeds , req: "+JSON.stringify(req.body));

    const userName = req.userName;
    if(userName == null) {
        res.sendStatus(constants.NO_MATCH_FOUND_IN_DB);
        return;
    }

    try {
        let feeds = [];
        // const tweets = await getAllTweetsByUserName(userName);
        // if(tweets) feeds.push(...tweets);
        const connections = await getAllConnections(userName);
        console.log("connections ", connections);
        if(connections) {
            const connections_n = connections.length;
            for(let i = 0; i < connections_n; i++) {
                const connectionUserName = connections[i];
                try {
                    const tweets = await getAllTweetsByUserName(connectionUserName);
                    if(tweets) feeds.push(...tweets);
                } catch (err) {
                    console.log(constants.ERROR_FETCHING_TWEET, err);
                    res.sendStatus(constants.ERROR_FETCHING_DB);
                }
            }
        }
        res.status(constants.SUCCESSFUL).json(feeds)
        
    }
    catch (err) {
        console.log(constants.ERROR_FETCHING_USER, err);
        res.sendStatus(constants.ERROR_FETCHING_DB);
    }
}

async function getAllConnections(userName) {
    try {
        const user = await User.findOne({ userName: userName });
        if(user == null) console.log(constants.USER_NOT_FOUND);
        else {
            return user.connections;
        }
    }
    catch(err) {
        console.log(constants.ERROR_FETCHING_USER, err);
    }
}

module.exports.changeName = async(req, res) => {
    try {
        const user = await User.updateOne({ userName: req.userName }, {$set: { name: req.body.name }});
        if(user.name === req.body.name) {
            res.status(constants.USER_NAME_CHANGE_SUCCESSFUL).json({
                userName: user.userName,
                name: user.name
            });
        }
        else {
            res.sendStatus(constants.USER_NAME_CHANGE_FAILED);
        }
    }
    catch(err) {
        res.sendStatus(constants.USER_NAME_CHANGE_FAILED);
    }
}

module.exports.changePassword = async(req, res) => {
    try {
        const passwordVerified = await verifyPassword(req.userName, req.body.password);
        console.log("passwordVerified: ", passwordVerified);
        if(!passwordVerified) {
            res.sendStatus(constants.WRONG_PASSWORD);
            return;
        }
        const encryptedPassword = await bcrypt.hash(req.body.newpassword, (Number)(process.env.SALT_ROUNDS));

        if(passwordVerified) {
            try {
                const updateResult = await User.updateOne({ userName: req.userName }, {$set: { password: encryptedPassword }});
                console.log("updateResult: ", updateResult);
                const user = await User.findOne({userName: req.userName});
                // console.log("user: ", user);
                // console.log("req.body.newpassword: ", encryptedPassword);
                // console.log("user.password: ", user.password);
                if(updateResult.modifiedCount > 0 && bcrypt.compare(req.body.newpassword, user.password)) {
                    res.sendStatus(constants.USER_PASSWORD_CHANGE_SUCCESSFUL);
                }
                else
                res.sendStatus(constants.USER_PASSWORD_CHANGE_FAILED);
            }
            catch(err) {
                console.log(constants.ERROR_ENCRYPTION_FAILED, err);
            }
        }
        else {
            res.sendStatus(constants.WRONG_PASSWORD);
        }
    }
    catch(err) {
        res.sendStatus(constants.USER_PASSWORD_CHANGE_FAILED, err);
    }
}

async function getAllTweetIdsByUserName(userName) {
    try {
        const user = await User.findOne({ userName: userName });
        if(user == null) console.log(constants.USER_NOT_FOUND);
        else {
            return user.tweets;
        }
    }
    catch(err) {
        console.log(constants.ERROR_FETCHING_USER, err);
    }
}

module.exports.getAllConnections = async (req, res) => {
    try {
        const user = await User.findOne({ userName: req.userName });
        if(user == null) res.sendStatus(constants.NO_MATCH_FOUND_IN_DB);

        else {
            if(user.connections) {
                res.status(constants.CONNECTIONS_FOUND).json(user.connections);
            }
            else {
                res.status(constants.CONNECTIONS_FOUND).json([]);
            }
        }
    } catch (err) {
        console.log(constants.ERROR_FETCHING_USER, err);
    }
}

module.exports.addConnection = async (req, res) => {
    try {
        console.log("POST /connections: ", req.userName);
        const user = await User.findOne({ userName: req.userName });
        if(user == null) res.sendStatus(constants.NO_MATCH_FOUND_IN_DB);
        else {            
            await User.updateOne({ userName: req.userName }, { $push: { connections: req.body.connectionUserName }});
            res.sendStatus(constants.CONNECTION_ADDED_SUCCESSFULLY);
        }
    } catch (err) {
        console.log(constants.ERROR_FETCHING_USER, err);
        res.sendStatus(constants.ERROR_FETCHING_DB);
    }
}

module.exports.deleteConnection = async (req, res) => {
    try {
        const user = await User.findOne({ userName: req.userName });
        if(user == null) res.sendStatus(constants.NO_MATCH_FOUND_IN_DB);
        else {            
            await User.updateOne({ userName: req.userName }, { $pop: { connections: req.body.connectionUserName }});
            res.sendStatus(constants.CONNECTION_DELETED_SUCCESSFULLY);
        }
    } catch (err) {
        console.log(constants.ERROR_FETCHING_USER, err);
        res.sendStatus(constants.ERROR_FETCHING_DB);
    }
}

module.exports.searchProfile = async(req, res) => {
    const searchString = req.query.user;
    let users = [];
    const regexString = ".*"+searchString+".*";
    try {
        const byName = await User.find({ name: {$regex: regexString}}, {userName: 1, name: 1});
        const byUserName = await User.find({ userName: {$regex: regexString}}, {userName: 1, name: 1});

        if(byName)
        users.push(...byName);

        if(byUserName) {
            byUserName.map((user) => {
                if(!users.includes(user)) {
                    users.push(user);
                }
            });
        }

        res.status(constants.SEARCH_SUCCESSFUL).json(users);
    } catch (err) {
        res.sendStatus(constants.SEARCH_FAILED);
    }
}

module.exports.getAllTweetsByUserName = async(req, res) => {
    const userName = req.query.userName;
    if(userName == null) {
        res.sendStatus(constants.ERROR_PARAMETER_MISSING);
    }
    else {
        try {
            const tweets = await getAllTweetsByUserName(userName);
            if(tweets == null) {
                res.sendStatus(constants.TWEETS_NOT_FOUND);
            }
            else {
                res.status(constants.TWEETS_FOUND).json(tweets);
            }
        } catch (err) {
            console.log(constants.ERROR_FETCHING_TWEET, err);
            res.sendStatus(constants.ERROR_FETCHING_DB);
        }
    }
}

async function getAllTweetsByUserName(userName) {
    try {
        const user = await User.findOne({ userName: userName });
        if(user == null) {
            console.log(constants.USER_NOT_FOUND);
            return null;
        }
        const tweetIds = user.tweets;
        console.log("user tweetsId: ", tweetIds);
        let tweets = [];
        if(tweetIds == null) {
            console.log("user.tweets is null");
        }
        else {
            for(let i = 0; i < tweetIds.length; i++) {
                try {
                    const tweetId = tweetIds[i];
                    const tweet = await tweetService.findTweetById(tweetId);
                    if(tweet) {
                        // console.log("tweet: ",tweet);
                        tweets.push(tweet);
                        // console.log("tweets: ",tweets);
                    }
                } catch (err) {
                    console.log("error fetching tweet from it\'s id: "+err);
                }
            }
        }
        console.log("tweets: ", tweets);
        return tweets;
    }
    catch(err) {
        console.log(constants.ERROR_FETCHING_USER, err);
    }
}

async function verifyPassword(userName, password) {
    try {
        console.log("verifyPassword("+userName+", "+password+")");
        const user = await User.findOne({ userName: userName });
        console.log("user: ", user);
        if(user == null) {
            console.log(constants.USER_NOT_FOUND)
            return false;
        }
        else {
            const encryptedPassword = await bcrypt.hash(password, (Number)(process.env.SALT_ROUNDS));
            const verified = await bcrypt.compare(password, user.password);
            if(verified) {
                return true;
            }
            else {
                console.log("password mismatch");
                return false;
            }
        }
    } catch (err) {
        console.log(constants.ERROR_FETCHING_USER, err);
        return false;
    }
}

module.exports.addTweetToId = async function(userName, tweetId) {
    try {
        const user = User.findOne({ userName: userName });
        if(user == null) return false;
        
        await User.updateOne({ userName: userName }, {$push: { tweets: tweetId }});
        return true;
    } catch(err) {
        console.log(constants.ERROR_FETCHING_DB, err);
        return false;
    }
}

module.exports.removeTweetFromId = async function(userName, tweetId) {
    try {
        const user = User.findOne({ userName: userName });
        if(user == null) return false;
        
        await User.updateOne({ userName: userName }, {$pop: { tweets: tweetId }});
        return true;
    } catch(err) {
        console.log(constants.ERROR_FETCHING_DB, err);
        return false;
    }
}