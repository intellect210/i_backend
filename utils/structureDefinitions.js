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
  classificationResultStructure
};