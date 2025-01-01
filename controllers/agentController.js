// I_BACKEND/controllers/agentController.js
const User = require('../models/userModel');
const AgentToken = require('../models/agentTokenModel');
const { encrypt, decrypt } = require('../utils/data/encryptAndDecrypt');
const { ERROR_CODES } = require('../config/constants');

const setGmailTokens = async (req, res) => {
    try {
        const { useruid } = req.params;
        const { authCode, refreshToken, accessToken } = req.body;

        console.log('setGmailTokens called with:', { useruid, authCode, refreshToken, accessToken });

        const user = await User.findOne({ useruid: useruid });
        if (!user) {
            console.error('User not found for useruid:', useruid);
            return res.status(404).json({ code: ERROR_CODES.USER_NOT_FOUND, message: 'User not found' });
        }

        const encryptedAuthCode = encrypt(authCode);
        const encryptedAccessToken = accessToken ? encrypt(accessToken) : null;
        const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

        if (encryptedAuthCode === null || (accessToken && encryptedAccessToken === null) || (refreshToken && encryptedRefreshToken === null)) {
            console.error('Encryption failed for one or more tokens');
            return res.status(500).json({ code: ERROR_CODES.ENCRYPTION_ERROR, message: 'Encryption failed' });
        }

        let agentToken = await AgentToken.findOne({ user: user._id });

        if (!agentToken) {
            agentToken = new AgentToken({
                user: user._id,
                encryptedAuthCode,
                encryptedAccessToken,
                encryptedRefreshToken,
            });
        } else {
            agentToken.encryptedAuthCode = encryptedAuthCode;
            agentToken.encryptedAccessToken = encryptedAccessToken;
            agentToken.encryptedRefreshToken = encryptedRefreshToken;
        }

        await agentToken.save();
        res.status(200).json({ message: 'Tokens set successfully' });

    } catch (error) {
        console.error('Error setting Gmail tokens:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ code: ERROR_CODES.VALIDATION_ERROR, message: error.message });
        }
        return res.status(500).json({ code: ERROR_CODES.DATABASE_ERROR, message: 'Database error' });
    }
};

module.exports = {
    setGmailTokens,
};