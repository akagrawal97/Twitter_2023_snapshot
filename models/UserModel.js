const mongoose = require('mongoose');
const mongodb = require('mongodb');

const userSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    connections: [{ type: String }],
    tweets: [{ type: mongodb.ObjectId, ref: 'Tweets' }]
}, {
    timestamps: true
});

const userModel = mongoose.model('Users', userSchema);
module.exports = userModel;