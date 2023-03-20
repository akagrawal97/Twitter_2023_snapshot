const mongoose = require('mongoose');
const mongodb = require('mongodb');

const tweetSchema = new mongoose.Schema({
    tweetMessage: { type: String, required: true },
    tweetOwner: { type: String, required: true }
}, {
    timestamps: true
});

const tweetModel = mongoose.model('Tweets', tweetSchema);
module.exports = tweetModel;