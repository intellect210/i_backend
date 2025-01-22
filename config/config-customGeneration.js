
class CustomGenerationConfig {
  static getBaseConfig() {
    return {
      temperature: 0.75,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4200,
    };
  }

  static getConfigWithStructure(structure) {
    return {
      ...this.getBaseConfig(),
      responseMimeType: 'application/json',
      responseSchema: structure,
    };
  }
}

module.exports = CustomGenerationConfig;