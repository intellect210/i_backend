module.exports = {
    agents: [
        {
            "name": "profile_edit",
            "descriptionOfAgentToFollowStrictly": "Not to be included in ouput- Update existing personal information with new details by integrating contextually. Retain all previous information and present the updated information clearly and organized.",
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