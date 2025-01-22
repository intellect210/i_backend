const { google } = require('googleapis');
const { ERROR_CODES } = require('../../config/config-constants');

class GmailTokenManagerLayer {
    constructor(tokenManager) {
        if (!tokenManager) {
            throw new Error("Token manager is required");
        }
        this.tokenManager = tokenManager;
        this.oAuth2Client = new google.auth.OAuth2(
            "547046004661-jpi8m7sv8lfmqt9cgg3828er63apo694.apps.googleusercontent.com",
            "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",
            "http://localhost:8080/oauth2callback"
        );
    }

    async getAccessToken(useruid) {
        console.log(`[DEBUG: GmailTokenManagerLayer] Getting access token for user: ${useruid}`);

        // Retrieve authCode, refreshToken and accessToken using tokenManager
        const authCode = await this.tokenManager.getAuthCode(useruid);
        let refreshToken = await this.tokenManager.getRefreshToken(useruid);
        let accessToken = await this.tokenManager.getAccessToken(useruid);

        // Handle edge case: if auth code is missing
        if (!authCode) {
            const errorMessage = `[DEBUG: GmailTokenManagerLayer] Auth code missing for user: ${useruid}.`;
            console.log(errorMessage);
            return {
                code: ERROR_CODES.INVALID_REQUEST,
                message: errorMessage,
                accessToken: null
            };
        }
        
        // Handle edge case: if refresh token is missing, try to get it from auth code
        if (!refreshToken) {
             console.log(`[DEBUG: GmailTokenManagerLayer] Refresh token missing for user: ${useruid}, attempting to get from auth code.`);
            const refreshTokenResponse = await this.getRefreshTokenFromAuthCode(useruid, authCode);
             if (refreshTokenResponse.code !== 200 || !refreshTokenResponse.refreshToken) {
                 console.log(`[DEBUG: GmailTokenManagerLayer] Failed to retrieve refresh token from auth code for user: ${useruid}.`);
               return {
                   code: refreshTokenResponse.code,
                   message: refreshTokenResponse.message,
                    accessToken: null,
                };
            }

            refreshToken = refreshTokenResponse.refreshToken;
           
        }

        // Check if the access token is present and valid
        if (accessToken && this._validateAccessToken(accessToken)) {
            console.log(`[DEBUG: GmailTokenManagerLayer] Valid access token found for user: ${useruid}.`);
            return {
                code: 200,
                message: 'Valid access token found',
                accessToken: accessToken,
            };
        }

        // Access token is missing or invalid, refresh the token
        console.log(`[DEBUG: GmailTokenManagerLayer] Access token missing or invalid, refreshing for user: ${useruid}.`);
        try {
            const newAccessToken = await this._refreshAccessToken(useruid, refreshToken);
            
            // Store new access token
            await this.tokenManager.setAccessToken(useruid, newAccessToken);

             // After successfully getting a new token, fetch and return it
            accessToken = await this.tokenManager.getAccessToken(useruid);
            if(!accessToken) {
                const errorMessage = `[DEBUG: GmailTokenManagerLayer] Failed to retrieve newly stored access token for user: ${useruid}.`;
                console.log(errorMessage);
                 return {
                    code: ERROR_CODES.TOKEN_NOT_FOUND,
                    message: errorMessage,
                    accessToken: null
                };
            }
            
            console.log(`[DEBUG: GmailTokenManagerLayer] Successfully refreshed and stored new access token for user: ${useruid}.`);
            return {
                code: 200,
                message: 'Successfully refreshed and stored new access token',
                accessToken: accessToken,
            };
        } catch (error) {
            console.log(`[DEBUG: GmailTokenManagerLayer] Error refreshing access token for user ${useruid}:`, error);
             return {
                code: error.code ? error.code : ERROR_CODES.TOKEN_ENCRYPTION_ERROR,
                message: error.message || "Failed to refresh access token",
                accessToken: null,
            };
        }
    }

    async _refreshAccessToken(useruid, refreshToken) {
        console.log(`[DEBUG: GmailTokenManagerLayer] Refreshing access token using refresh token for user: ${useruid}`);
        try {
            this.oAuth2Client.setCredentials({
                refresh_token: refreshToken
              });
            const {token} = await this.oAuth2Client.getAccessToken();

            if (!token) {
                const errorMessage = `[DEBUG: GmailTokenManagerLayer] Failed to refresh access token from google api for user: ${useruid}.`;
                console.log(errorMessage);
                 return {
                    code: ERROR_CODES.TOKEN_NOT_FOUND,
                    message: errorMessage,
                    accessToken: null
                 };
             }

            console.log(`[DEBUG: GmailTokenManagerLayer] Successfully refreshed access token from google api for user: ${useruid}`);
            return token;
        } catch (error) {
           const errorMessage = `[DEBUG: GmailTokenManagerLayer] Error during refreshing access token from google api for user: ${useruid}: ${error.message}.`;
           console.log(errorMessage);
           return {
                code: ERROR_CODES.TOKEN_NOT_FOUND,
                message: errorMessage,
                accessToken: null,
            };
        }
    }


    _validateAccessToken(accessToken) {
        if (!accessToken) {
            console.log('[DEBUG: GmailTokenManagerLayer] Access token is missing.');
            return false;
        }

         // Implement the logic to check if the access token is valid and not expired, example
        // here we assume access token valid for 30 minutes
         const tokenCreatedAt = Date.parse(accessToken.createdAt);
         if (!tokenCreatedAt) return false; // If no creation time, consider invalid
        const ttl = 30 * 60 * 1000; // 30 minutes in milliseconds
        const isExpired = Date.now() - tokenCreatedAt > ttl;
        return !isExpired;
    }

    async getRefreshTokenFromAuthCode(useruid, authCode) {
        console.log(`[DEBUG: GmailTokenManagerLayer] Getting refresh token from auth code for user: ${useruid}`);
        try {
            const { tokens } = await this.oAuth2Client.getToken(authCode);

           if (!tokens.refresh_token) {
              const errorMessage = `[DEBUG: GmailTokenManagerLayer] Failed to get refresh token from auth code for user: ${useruid}.`;
              console.log(errorMessage);
               return {
                  code: ERROR_CODES.TOKEN_NOT_FOUND,
                  message: errorMessage,
                  refreshToken: null,
              };
            }

            // Store the refresh token using token manager
            await this.tokenManager.setRefreshToken(useruid, tokens.refresh_token);
           
            console.log(`[DEBUG: GmailTokenManagerLayer] Successfully retrieved and stored refresh token for user: ${useruid}`);
            return {
                code: 200,
                message: "Successfully retrieved and stored refresh token",
                refreshToken: tokens.refresh_token,
            };

        } catch (error) {
            const errorMessage = `[DEBUG: GmailTokenManagerLayer] Error getting refresh token from auth code for user: ${useruid}: ${error.message}`;
            console.log(errorMessage, error);
            return {
                code: ERROR_CODES.TOKEN_NOT_FOUND,
                message: errorMessage,
                refreshToken: null,
            };
        }
    }
}

module.exports = GmailTokenManagerLayer;