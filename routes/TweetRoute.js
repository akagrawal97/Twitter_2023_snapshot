const router = require('express').Router();
const authService = require('../authService');
const tweetService = require('../services/tweetService');

//anyone can see a tweet using it's tweetId
router.get('/', async (req, res) => {
    await tweetService.getTweetById(req, res);
});

//logged in user can add tweet
router.post('/', authService.authenticateToken, async (req, res) => {
    await tweetService.addNewTweet(req, res);
});

//logged in user can update his tweet using tweetId
router.put('/', authService.authenticateToken, async (req, res) => {

});

//logged in user can delete his tweet using tweetId
router.delete('/', authService.authenticateToken, async (req, res) => {
    await tweetService.deleteTweet(req, res);
});

module.exports = router;