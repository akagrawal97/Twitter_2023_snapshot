require('dotenv').config({ path: __dirname+'/.env' });
const router = require('express').Router();
const authService = require('../authService');
const userService = require('../services/userService');

//To view any user's profile using userName. eg, /user?userName=UserName
router.get('/profile', async (req, res) => {
    await userService.getProfileById(req, res);
});

//For user to login
router.post('/login', async (req, res) => {
    await userService.loginUser(req, res);
});

//For user to register
router.post('/register', async (req, res) => {
    await userService.registerNewUser(req, res);
});

//Feeds of the logged in user
router.get('/feeds', authService.authenticateToken, async (req, res) => {
    await userService.getUserFeeds(req, res);
});

//Logged in user can edit their own profile Name
router.put('/name', authService.authenticateToken, async (req, res) => {
    await userService.changeName(req, res);
});

//Logged in user can edit their own profile password
router.put('/password', authService.authenticateToken, async (req, res) => {
    await userService.changePassword(req, res);
});

//Logged in user can see all their connections
router.get('/connections', authService.authenticateToken, async (req, res) => {
    await userService.getAllConnections(req, res);
});

//Logged in user can add connections using userName
router.post('/connections', authService.authenticateToken, async (req, res) => {
    await userService.addConnection(req, res);
});

//Logged in user can remove their connections using userName
router.delete('/connections', authService.authenticateToken, async (req, res) => {
    await userService.deleteConnection(req, res);
});

//Any one can search for list of users with name and userName
router.get('/search', async (req, res) => {
    await userService.searchProfile(req, res);
});

//Get all the tweets by userName
router.get('/getAllTweets', async (req, res) => {
    await userService.getAllTweetsByUserName(req, res);
});

module.exports = router;