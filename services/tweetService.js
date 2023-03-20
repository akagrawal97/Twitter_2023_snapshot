const constants = require('../constants');
const Tweet = require('../models/TweetModel');
const userService = require('../services/userService');

module.exports.findTweetById = async(tweetId) => {
    let tweet = {};
    try {
        tweet = await Tweet.findById(tweetId);
    } catch (err) {
        console.log(constants.ERROR_FETCHING_TWEET);
    }
    return tweet;
}

module.exports.getTweetById = async(req, res) => {
    const tweetId = req.query.tweetId;
    try {
        const tweet = await this.findTweetById(tweetId);
        if(tweet) res.status(constants.TWEET_FOUND).json(tweet);
        else {
            res.sendStatus(constants.TWEET_NOT_FOUND);
        }
    } catch (err) {
        console.log(constants.ERROR_FETCHING_TWEET, err);
        res.sendStatus(constants.ERROR_FETCHING_DB);
    }
}

module.exports.addNewTweet = async(req, res) => {
    try {
        const tweetMessage = req.body.tweetMessage;
        const tweetOwner = req.userName;
        const newTweet = new Tweet({
            tweetMessage: tweetMessage,
            tweetOwner: tweetOwner
        });
        const tweet = await newTweet.save();
        if(tweet == null) res.sendStatus(constants.TWEET_NOT_CREATED);
        else {
            const tweetAddedToUser = await userService.addTweetToId(tweetOwner, tweet._id);
            if(tweetAddedToUser) res.sendStatus(constants.TWEET_CREATED);
            else res.sendStatus(constants.TWEET_NOT_CREATED);
        }
    } catch (err) {
        console.log(constants.ERROR_ADDING_TWEET, err);
        res.sendStatus(constants.TWEET_NOT_CREATED);
    }
}

module.exports.deleteTweet = async(req, res) => {
    try {
        const tweetId = req.query.tweetId;
        const tweetOwner = req.userName;
        
        const tweet = await this.findTweetById(tweetId);
        if(tweet == null || tweet.tweetOwner != tweetOwner) res.sendStatus(constants.TWEET_NOT_DELETED);
        else {
            const tweetDeletedFromUser = await userService.removeTweetFromId(tweetOwner, tweetId);
            if(tweetDeletedFromUser) {
                await Tweet.deleteOne({ _id: tweetId });
                res.sendStatus(constants.TWEET_DELETED);
            }
            else res.sendStatus(constants.TWEET_NOT_DELETED);
        }
    } catch (err) {
        console.log(constants.ERROR_ADDING_TWEET, err);
        res.sendStatus(constants.TWEET_NOT_DELETED);
    }
}

module.exports.modifyTweet = async(req, res) => {
    try {
        const tweetId = req.query.tweetId;
        const tweetOwner = req.userName;
        const tweetMessage = req.body.tweetMessage;
        
        const tweet = await this.findTweetById(tweetId);
        if(tweet == null || tweet.tweetOwner != tweetOwner) res.sendStatus(constants.TWEET_NOT_MODIFIED);
        else {
            await Tweet.updateOne({ _id: tweetId }, {$set: { tweetMessage: tweetMessage}});
            res.sendStatus(constants.TWEET_MODIFIED);
        }
    } catch (err) {
        console.log(constants.ERROR_FETCHING_DB, err);
        res.sendStatus(constants.TWEET_NOT_MODIFIED);
    }
}