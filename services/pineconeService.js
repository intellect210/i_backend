const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
const {
  PINECONE_INDEX_NAME,
  MODELS,
  DEFAULT_TOP_K,
  DEFAULT_INCLUDE_VALUES,
  DEFAULT_INCLUDE_METADATA,
} = require('../config/constants');

class PineconeService {
  constructor() {
    // Initialize Pinecone with API key
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // Initialize Google Generative AI with API key
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: MODELS.VERTEX_MODEL_NAME,
    });

    this.index = null; // Index will be initialized lazily
  }

  // Lazy initialization of the Pinecone index
  async getIndex() {
    if (!this.index) {
      this.index = this.pinecone.index(PINECONE_INDEX_NAME);
    }
    return this.index;
  }

  // Generate embedding for the given text
  async generateEmbedding(text) {
    try {
      const result = await this.model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  // Add data to Pinecone
  async addData(text) {
    try {
      const index = await this.getIndex();
      const id = uuidv4();
      const embedding = await this.generateEmbedding(text);

      // Upsert data into Pinecone
      await index.upsert([{ id, values: embedding, metadata: { text } }]);

      console.log(`Data added to Pinecone with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('Error adding data to Pinecone:', error);
      throw error;
    }
  }

  // Query data from Pinecone
  async queryData(message, queryParams = {}) {
    try {
      const index = await this.getIndex();
      const topK = queryParams.topK || DEFAULT_TOP_K;
      const includeValues =
        queryParams.includeValues !== undefined
          ? queryParams.includeValues
          : DEFAULT_INCLUDE_VALUES;
      const includeMetadata =
        queryParams.includeMetadata !== undefined
          ? queryParams.includeMetadata
          : DEFAULT_INCLUDE_METADATA;

      const embedding = await this.generateEmbedding(message);
      const queryResponse = await index.query({
        vector: embedding,
        topK,
        includeValues,
        includeMetadata,
      });

      if (queryResponse && queryResponse.matches) {
        return queryResponse.matches.map((match) => ({
          id: match.id,
          text: match.metadata?.text || null,
          score: match.score,
        }));
      } else {
        console.log('No matches found.');
        return [];
      }
    } catch (error) {
      console.error('Error querying data from Pinecone:', error);
      throw error;
    }
  }
}

module.exports = PineconeService;
