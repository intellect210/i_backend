// I_BACKEND/utils/structureDefinitions.txt
const classificationResultStructure = {
  type: 'object',
  properties: {
    payload: {
      type: 'object',
      properties: {
        classification: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            final_edited_info_only: { type: 'string' },
          },
          required: ['final_edited_info_only'],
        },
        actionType: { type: 'string'}
      },
      required: ['classification', 'data'],
    },
  },
  required: ['payload'],
};

const automationFollowupStructure = {
  "type": "object",
  "description": "The root object that contains the actions to be executed by the system.",
  "properties": {
    "actions": {
      "type": "object",
      "description": "A collection of actions that the system can perform, each with specific settings.",
      "properties": {
        "fetchEmails": {
          "type": "object",
          "description": "Configuration settings for the email fetching action.",
          "properties": {
            "isIncluded": {
              "type": "boolean",
              "description": "Indicates whether the action to fetch emails is enabled (true) or disabled (false)."
            },
            "SearchQueryInDetails": {
              "type": "string",
              "description": "A query string used to filter the emails fetched, allowing for specific searches within email details."
            },
            "executionOrderIfIncluded": {
              "type": "number",
              "description": "Defines the order of execution for this action if it is included, with lower numbers indicating higher priority."
            }
          },
          "required": [
            "isIncluded"
          ]
        },
        "llmPipeline": {
          "type": "object",
          "description": "Configuration settings for the LLM processing pipeline.",
          "properties": {
            "systemInstructions": {
              "type": "string",
              "description": "Instructions for the language model (LLM) to follow, determining the specific task (e.g., summarizing emails).",
              "enum": [
                "summarizeEmails",
                "other"
              ]
            },
            "isIncluded": {
              "type": "boolean",
              "description": "Indicates whether the LLM pipeline action is enabled (true) or disabled (false)."
            },
            "executionOrderIfIncluded": {
              "type": "number",
              "description": "Defines the order of execution for this action if it is included, with lower numbers indicating higher priority."
            },
            "BaseQuery": {
              "type": "string",
              "description": "The base query used by the LLM for processing emails, which can influence the outcomes of the LLM's operations."
            }
          },
          "required": [
            "isIncluded"
          ]
        },
        "sendReminder": {
          "type": "object",
          "description": "Configuration settings for the action of sending reminders.",
          "properties": {
            "isIncluded": {
              "type": "boolean",
              "description": "Indicates whether the action to send reminders is enabled (true) or disabled (false)."
            },
            "executionOrderIfIncluded": {
              "type": "number",
              "description": "Defines the order of execution for this action if it is included, with lower numbers indicating higher priority."
            }
          },
          "required": [
            "isIncluded"
          ]
        }
      }
    }
  },
  "required": [
    "actions"
  ]
};

const remindersStructure = {
  "type": "object",
  "properties": {
    "task": {
      "type": "object",
      "description": "Details of the extracted task or reminder.",
      "nullable": true,
      "properties": {
        "taskDescription": {
          "type": "string"
        },
        "time": {
          "type": "string"
        },
        "recurrence": {
          "type": "object",
          "description": "Information about how often the task should repeat.",
          "nullable": true,
          "properties": {
            "type": {
              "type": "string",
              "enum": [
                "once",
                "daily",
                "weekly",
                "limited"
              ]
            },
            "days": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": [
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday"
                ]
              }
            },
            "ends": {
              "type": "object",
              "description": "Specifies when the recurrence ends, if applicable.",
              "nullable": true,
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "after_repetitions",
                    "on_date"
                  ]
                },
                "value": {
                  "type": "string"
                }
              }
            },
            "start_date": {
              "type": "string"
            },
            "one_time_date": {
              "type": "string",
              "description": "If only time is given by user then one_time_date is necessary to schedule the reminder so either ask user or use todays date"
            }
          },
          "required": [
            "type",
            "one_time_date"
          ]
        }
      },
      "required": [
        "taskDescription",
        "recurrence"
      ]
    }
  }
};

const personalInfoUpdateStructure = {
  type: 'object',
  properties: {
    final_edited_info_only: { type: 'string' }
  },
  required: ['final_edited_info_only']
};

const classificationResultBoolStructure = {
  type: 'object',
  properties: {
    classification: { type: 'boolean' }
  },
  required: ['classification']
};

module.exports = {
  personalInfoUpdateStructure,
  classificationResultBoolStructure,
  classificationResultStructure,
  automationFollowupStructure,
  remindersStructure,
};