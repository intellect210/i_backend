const Preference = require('../../models/preferenceModel');
const User = require('../../models/userModel'); // Import User model
const { PREFERENCE_KEYS, ERROR_CODES } = require('../../config/constants');
const logger = require('../logger');

class PreferenceManager {
    constructor() {
      // no constructor is needed
    }

    async _getUserByUid(useruid) {
        try {
            const user = await User.findOne({ useruid });
            if (!user) {
                console.log(`[DEBUG: PreferenceManager] User not found for useruid: ${useruid}`);
                return null;
            }
            return user;
        } catch (error) {
             console.log(`[DEBUG: PreferenceManager] Error getting user for useruid: ${useruid}:`, error);
            logger.error(`Error getting user for useruid: ${useruid}`, error);
           return null;
        }
    }


    async _getPreference(useruid, preferenceKey) {
        console.log(`[DEBUG: PreferenceManager] Getting preference for useruid: ${useruid}, key: ${preferenceKey}`);
        try {
            const user = await this._getUserByUid(useruid);
             if(!user) {
                console.log(`[DEBUG: PreferenceManager] User not found for useruid: ${useruid} while getting preferences.`);
               return false;
             }
            const preference = await Preference.findOne({ user: user._id, preferenceKey: preferenceKey });
            if (!preference) {
                console.log(`[DEBUG: PreferenceManager] Preference not found for useruid: ${useruid}, key: ${preferenceKey}. Returning default value (false).`);
                return false;
            }
            console.log(`[DEBUG: PreferenceManager] Preference found for useruid: ${useruid}, key: ${preferenceKey}, value: ${preference.value}`);
            return preference.value;
        } catch (error) {
            console.log(`[DEBUG: PreferenceManager] Error getting preference for useruid: ${useruid}, key: ${preferenceKey}:`, error);
           logger.error(`Error getting preference for useruid: ${useruid}, key: ${preferenceKey}`, error);
            return false; // Return default value in case of error
        }
    }


    async _setPreference(useruid, preferenceKey, value) {
        console.log(`[DEBUG: PreferenceManager] Setting preference for useruid: ${useruid}, key: ${preferenceKey}, value: ${value}`);
        try {
             const user = await this._getUserByUid(useruid);
             if(!user) {
                console.log(`[DEBUG: PreferenceManager] User not found for useruid: ${useruid} while setting preferences.`);
                throw {code: ERROR_CODES.USER_NOT_FOUND, message:`User not found for useruid: ${useruid}`}
             }
             const filter = { user: user._id, preferenceKey: preferenceKey };
              const update = { value: value, updatedAt: Date.now() };

            const preference = await Preference.findOneAndUpdate(
                filter,
                update,
                { new: true, upsert: true }
            );
            console.log(`[DEBUG: PreferenceManager] Preference set for useruid: ${useruid}, key: ${preferenceKey}, value: ${value}`);
            return preference;
        } catch (error) {
            console.log(`[DEBUG: PreferenceManager] Error setting preference for useruid: ${useruid}, key: ${preferenceKey}, value: ${value}:`, error);
           logger.error(`Error setting preference for useruid: ${useruid}, key: ${preferenceKey}, value: ${value}`, error);
            throw {code: error.code ? error.code : ERROR_CODES.DATABASE_ERROR , message: error.message ? error.message :  `Error setting preference for useruid: ${useruid}, key: ${preferenceKey}, value: ${value}`}
        }
    }

    async getPreference(useruid, preferenceKey) {
      return this._getPreference(useruid, preferenceKey);
    }


    async setPreference(useruid, preferenceKey, value) {
        return this._setPreference(useruid, preferenceKey, value);
    }

    async getAllPreferences(useruid) {
      console.log(`[DEBUG: PreferenceManager] Getting all preferences for useruid: ${useruid}`);
        try {
              const user = await this._getUserByUid(useruid);
             if(!user) {
                console.log(`[DEBUG: PreferenceManager] User not found for useruid: ${useruid} while getting all preferences.`);
                return {};
             }
            const preferences = await Preference.find({ user: user._id });
            if (!preferences || preferences.length === 0) {
                console.log(`[DEBUG: PreferenceManager] No preferences found for useruid: ${useruid}.`);
                return {};
            }
             const preferenceMap = {};
           preferences.forEach(pref => {
              preferenceMap[pref.preferenceKey] = pref.value;
           });
            console.log(`[DEBUG: PreferenceManager] Preferences found for useruid: ${useruid}.`);
           return preferenceMap;
         } catch (error) {
          console.log(`[DEBUG: PreferenceManager] Error getting all preferences for useruid: ${useruid}:`, error);
          logger.error(`Error getting all preferences for useruid: ${useruid}`, error);
             return {};
        }
    }
}

module.exports = PreferenceManager;