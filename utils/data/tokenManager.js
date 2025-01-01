// I_BACKEND/utils/data/tokenManager.js
const AgentToken = require('../../models/agentTokenModel');
const { encrypt, decrypt } = require('./encryptAndDecrypt'); // Import from encryptAndDecrypt.js
const User = require('../../models/userModel');

class TokenManager {
    async _getToken(useruid, tokenField) {
        console.log('Calling _getToken with useruid:', useruid, 'and tokenField:', tokenField);

        try {
            const user = await User.findOne({ useruid: useruid });
            if (!user) {
                console.log('User not found for useruid:', useruid);
                return null; // Handle user not found
            }

            const agentToken = await AgentToken.findOne({ user: user._id }).populate('user');
            console.log('AgentToken found:', agentToken);

            if (!agentToken) {
                console.log('AgentToken not found for user');
                return null; // Handle AgentToken not found
            }

            if (agentToken[tokenField]) {
                const decryptedToken = decrypt(agentToken[tokenField]);
                if (decryptedToken === null) {
                    console.log('Decryption failed for token:', tokenField);
                    return null; // Handle decryption failure
                }
                return decryptedToken;
            } else {
                console.log('Token field not set:', tokenField);
                return null;
            }
        } catch (error) {
            console.log('Error in _getToken:', error);
            return null; // Handle other errors
        }
    }

    async _setToken(useruid, tokenField, token) {
        console.log('Calling _setToken with useruid:', useruid, ', tokenField:', tokenField, ', token:', token);
        try {
            const user = await User.findOne({ useruid: useruid });
            if (!user) {
                console.log('User not found for useruid:', useruid);
                return; // Handle user not found
            }

            const encryptedToken = encrypt(token);
            if (encryptedToken === null) {
                console.log('Encryption failed for token:', tokenField);
                return; // Handle encryption failure
            }

            let agentToken = await AgentToken.findOne({ user: user._id });

            if (!agentToken) {
                agentToken = new AgentToken({
                    user: user._id,
                    [tokenField]: encryptedToken
                });
            } else {
                agentToken[tokenField] = encryptedToken;
            }

            await agentToken.save();
            console.log('Token saved successfully');
        } catch (error) {
            console.log('Error in _setToken:', error);
        }
    }

    async _resetToken(useruid, tokenField) {
        console.log('Calling _resetToken with useruid:', useruid, 'and tokenField:', tokenField);
        try {
            const user = await User.findOne({ useruid: useruid });
            if (!user) {
                console.log('User not found for useruid:', useruid);
                return; // Handle user not found
            }

            const agentToken = await AgentToken.findOneAndUpdate(
                { user: user._id },
                { [tokenField]: null },
                { new: true }
            );

            if (!agentToken) {
                console.log('AgentToken not found for user');
                return; // Handle AgentToken not found
            }
            console.log('Token reset successfully');
        } catch (error) {
            console.log('Error in _resetToken:', error);
        }
    }

    async getAuthCode(useruid) {
        return this._getToken(useruid, 'encryptedAuthCode');
    }

    async getRefreshToken(useruid) {
        return this._getToken(useruid, 'encryptedRefreshToken');
    }

    async getAccessToken(useruid) {
        return this._getToken(useruid, 'encryptedAccessToken');
    }

    async setAuthCode(useruid, authCode) {
        await this._setToken(useruid, 'encryptedAuthCode', authCode);
    }

    async setRefreshToken(useruid, refreshToken) {
        if (refreshToken) {
            await this._setToken(useruid, 'encryptedRefreshToken', refreshToken);
        } else {
            console.warn('Refresh token is not provided. Skipping update.');
        }
    }

    async setAccessToken(useruid, accessToken) {
        await this._setToken(useruid, 'encryptedAccessToken', accessToken);
    }

    async resetAuthCode(useruid) {
        await this._resetToken(useruid, 'encryptedAuthCode');
    }

    async resetRefreshToken(useruid) {
        await this._resetToken(useruid, 'encryptedRefreshToken');
    }

    async resetAccessToken(useruid) {
        await this._resetToken(useruid, 'encryptedAccessToken');
    }
}

module.exports = TokenManager;