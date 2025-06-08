// Client for fetching API keys securely
class ApiKeyClient {
  static async getGeminiApiKey() {
    try {
      const response = await fetch('/.netlify/functions/getGeminiKey');
      if (!response.ok) {
        throw new Error(`Failed to fetch API key: ${response.statusText}`);
      }
      const data = await response.json();
      return data.key;
    } catch (error) {
      console.error('Error fetching Gemini API key:', error);
      throw error;
    }
  }
}

export default ApiKeyClient;
