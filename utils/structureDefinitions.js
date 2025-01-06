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
  classificationResultBoolStructure
};