const express = require('express');
const router = express.Router();
const TokenManager = require('../utils/respositories/tokenManager');
const GmailTokenManagerLayer = require('../utils/helpers/gmail-token-manager-layer');

const tokenManager = new TokenManager();
const gmailTokenManagerLayer = new GmailTokenManagerLayer(tokenManager);

// Route to test getAccessToken
router.post('/gmail/getAccessToken', async (req, res) => {
    try {
        const { useruid } = req.body;
        if (!useruid) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        const response = await gmailTokenManagerLayer.getAccessToken(useruid);
        res.json(response);
    } catch (error) {
        console.log('Error testing getAccessToken:', error);
        res.status(500).json({ message: 'Error testing getAccessToken', error: error.message });
    }
});

// Route to test getRefreshTokenFromAuthCode
router.post('/gmail/getRefreshTokenFromAuthCode', async (req, res) => {
    try {
      const { useruid, authCode } = req.body;
      if (!useruid || !authCode) {
        return res.status(400).json({ message: 'User ID and Auth Code are required' });
      }
      const response = await gmailTokenManagerLayer.getRefreshTokenFromAuthCode(useruid, authCode);
      res.json(response);
    } catch (error) {
      console.log('Error testing getRefreshTokenFromAuthCode:', error);
      res.status(500).json({ message: 'Error testing getRefreshTokenFromAuthCode', error: error.message });
    }
  });

// Route to test _refreshAccessToken (This is for testing purposes only)
router.post('/gmail/_refreshAccessToken', async (req, res) => {
    try {
        const { useruid, refreshToken } = req.body;
        if (!useruid || !refreshToken) {
           return res.status(400).json({ message: 'User ID and refresh token are required' });
        }
        const response = await gmailTokenManagerLayer._refreshAccessToken(useruid, refreshToken);
        res.json({code: 200, message:"Successfully refreshed token", accessToken:response});
    } catch (error) {
        console.log('Error testing _refreshAccessToken:', error);
       res.status(500).json({ message: 'Error testing _refreshAccessToken', error: error.message});
    }
});

module.exports = router;