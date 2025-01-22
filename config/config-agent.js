module.exports = {
    agents: [
        {
            "name": "profile_edit",
                "descriptionOfAgentToFollowStrictly": "Not to be included in output - Update existing personal information with new details by integrating contextually. Retain all previous information and present the updated information clearly and organized. Focus on stable information for example such as usernames, addresses, and college etc., while avoiding transient details like daily activities or short-term events. Compress the information by keeping important words and removing redundant English words, ensuring the summary is concise and to the point."
,
              "actionType": "personalInfoUpdate",
            "dataStructure": {
                "type": "object",
                "properties": {
                    "final_edited_info_only": {
                        "type": "string"
                    }
                },
                "required": [
                    "final_edited_info_only"
                ]
            }
        }
    ]
};