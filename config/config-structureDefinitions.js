// I_BACKEND/utils/structureDefinitions.txt
const classificationResultStructure = {
  type: 'object',
  properties: {
    payload: {
      type: 'object',
      properties: {
        classification: { type: 'string', description: 'The classification of the user message' },
        data: {
          type: 'object',
          description: 'Data required for the action',
          properties: {
            final_edited_info_only: { type: 'string', description: 'The final edited personal information' },
          },
          required: ['final_edited_info_only'],
        },
        actionType: { type: 'string', description: 'The type of action to perform' }
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
          "type": "string",
          description: "Description of the task or reminder"
        },
        "time": {
          "type": "string",
          description: "Time for the task or reminder"
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
              ],
              description: "Type of recurrence"
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
                ],
                  description: "Days for the weekly recurrence"
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
                  ],
                  description: "Type of end condition for the recurrence"
                },
                "value": {
                  "type": "string",
                  description: "Value of the end condition"
                }
              }
            },
            "start_date": {
              "type": "string",
              description: "Start date for the recurrence"
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
   description: 'Structure for personal information update action',
  properties: {
    final_edited_info_only: { type: 'string', description: 'Final edited personal info string' }
  },
  required: ['final_edited_info_only']
};

const classificationResultBoolStructure = {
  type: 'object',
  properties: {
    classification: { type: 'boolean', description: 'Boolean classification result' }
  },
  required: ['classification']
};

const combinedActionStructure = {
  "type": "object",
  "description": "Structure for combined actions: no action, personal info update, or schedule reminder/followups/time-related schedulers",
  "properties": {
    "payload": {
      "type": "object",
      "description": "Payload containing action details",
      "properties": {
        "classification": {
          "type": "string",
          "description": "Classification for the action type",
          "enum": [
            "no_action_needed",
            "personalInfoUpdate",
            "scheduleReminder"
          ]
        },
        "data": {
          "type": "object",
          "description": "Data for the action based on classification",
          "properties": {
            "final_edited_info_only": {
              "type": "string",
              "description": "Final edited personal info string"
            },
            "task": {
              "type": "object",
              "description": "Details of the extracted task or reminder or followups or task.",
              "nullable": true,
              "properties": {
                "taskDescription": {
                  "type": "string",
                  "description": "Description of the task or reminder or followup in details"
                },
                "time": {
                  "type": "string",
                  "description": "Time for the task or reminder in HH:mm format"
                },
                "recurrence": {
                  "type": "object",
                  "description": "Information about how often the task should repeat.",
                  "nullable": true,
                  "properties": {
                    "type": {
                      "type": "string",
                      "description": "Type of recurrence",
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
                        "description": "Days for the weekly recurrence",
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
                          "description": "Type of end condition for the recurrence",
                          "enum": [
                            "after_repetitions",
                            "on_date"
                          ]
                        },
                        "value": {
                          "type": "string",
                          "description": "Value of the end condition"
                        }
                      }
                    },
                    "start_date": {
                      "type": "string",
                      "description": "Start date for the recurrence in YYYY-MM-DD format"
                    },
                    "one_time_date": {
                      "type": "string",
                      "description": "If only time is given by user then one_time_date is necessary to schedule the reminder so either ask user or use today's date in YYYY-MM-DD format"
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
        }
      },
      "required": [
        "classification"
      ]
    }
  },
  "required": [
    "payload"
  ]
};

module.exports = {
  personalInfoUpdateStructure,
  classificationResultBoolStructure,
  classificationResultStructure,
  automationFollowupStructure,
  remindersStructure,
    combinedActionStructure
};