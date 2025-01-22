class DataInjector {
    constructor() {
        // No constructor needed for this layer
    }
  
    injectData(history, userData, modelData) {
        if (!Array.isArray(history)) {
            throw new Error("History must be an array.");
        }

        history = [
            {
              role: 'user',
              parts: [{text: userData}],
            },
            {
                role: 'model',
                parts: [{text: modelData}],
            }
            ,
            ...history
        ]

        return history;
    }
  }
  
  module.exports = DataInjector;