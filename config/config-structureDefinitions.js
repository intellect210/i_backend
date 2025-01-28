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
  "properties": {
    "actions": {
      "type": "object",
      "properties": {
        "fetchEmails": {
          "type": "object",
          "properties": {
            "isIncluded": {
              "type": "boolean"
            },
            "SearchQueryInDetails": {
              "type": "string"
            },
            "executionOrderIfIncluded": {
              "type": "number"
            }
          },
          "required": [
            "isIncluded",
            "executionOrderIfIncluded"
          ],
          "description": "Fetches email context if required for subsequent actions."
        },
        "llmPipeline": {
          "type": "object",
          "properties": {
            "isIncluded": {
              "type": "boolean"
            },
            "systemInstructions": {
              "type": "string",
              "enum": [
                "summarizeEmails",
                "generateResponse",
                "summarizeCalendarEvents",
                "summarizeScreenContext",
                "factChecker"
              ]
            },
            "executionOrderIfIncluded": {
              "type": "number"
            },
            "inputContexts": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": [
                  "fetchedEmails",
                  "screenContext",
                  "calendarEvents",
                  "userQuery"
                ]
              }
            },
            "baseQuery": {
              "type": "string"
            }
          },
          "required": [
            "isIncluded",
            "executionOrderIfIncluded"
          ],
          "description": "Configures the LLM for tasks like summarizing or generating responses. Multiple llmPipeline actions can be included in a task."
        },
        "getScreenContext": {
          "type": "object",
          "properties": {
            "isIncluded": {
              "type": "boolean"
            },
            "executionOrderIfIncluded": {
              "type": "number"
            }
          },
          "required": [
            "isIncluded",
            "executionOrderIfIncluded"
          ],
          "description": "Captures the user's current screen context."
        },
        "getNotificationFromUserDevice": {
          "type": "object",
          "properties": {
            "isIncluded": {
              "type": "boolean"
            },
            "executionOrderIfIncluded": {
              "type": "number"
            },
            "filterByApp": {
              "type": "string"
            },
            "filterByContent": {
              "type": "string"
            }
          },
          "required": [
            "isIncluded",
            "executionOrderIfIncluded"
          ],
          "description": "Retrieves recent user device notifications."
        },
        "getCalendarEvents": {
          "type": "object",
          "properties": {
            "isIncluded": {
              "type": "boolean"
            },
            "executionOrderIfIncluded": {
              "type": "number"
            },
            "timeRange": {
              "type": "object",
              "properties": {
                "start": {
                  "type": "string"
                },
                "end": {
                  "type": "string"
                }
              },
              "required": [
                "start",
                "end"
              ],
              "description": "The time range for fetching events."
            }
          },
          "required": [
            "isIncluded",
            "executionOrderIfIncluded"
          ],
          "description": "Fetches calendar events for a specified time range."
        },
        "noActionOption": {
          "type": "object",
          "properties": {
            "isIncluded": {
              "type": "boolean"
            }
          },
          "required": [
            "isIncluded"
          ],
          "description": "Indicates no action is required or if the user explicitly asked for it."
        }
      },
      "description": "A collection of actions that the system can perform. Actions within a task are executed in order, and multiple LLM pipelines can be used within a single task."
    }
  },
  "required": [
    "actions"
  ],
  "description": "Contains the actions to be executed by the system."
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