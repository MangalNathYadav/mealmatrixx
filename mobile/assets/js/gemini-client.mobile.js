// Gemini API Client for mobile advanced features
// This is a direct copy of the desktop Gemini client, but can be customized for mobile needs

class GeminiClient {
    constructor(apiKey = null) {
        // Hardcoded Gemini API key for local/dev use
        this.apiKey = 'AIzaSyCjLU7RoLVj-ahKYP7ULWdTY6PRFIxKdiM';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.modelName = 'models/gemini-2.0-flash';
        this.isInitialized = false;
    }
    async initialize() {
    // Always use the hardcoded key
    this.isInitialized = true;
    }
    async generateContent(prompt, retryCount = 0, maxRetries = 10) {
        if (retryCount >= maxRetries) throw new Error('Maximum retry attempts reached.');
        if (!this.isInitialized) await this.initialize();
        const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 2048, topK: 1, topP: 0.8 }
                }),
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!response.ok) {
                if (response.status === 503 && retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                    return this.generateContent(prompt, retryCount + 1, maxRetries);
                }
                throw new Error(`Gemini API request failed (${response.status}): ${response.statusText}`);
            }
            const data = await response.json();
            if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return { text: data.candidates[0].content.parts[0].text };
            } else {
                throw new Error('Invalid response format from Gemini API');
            }
        } catch (error) {
            clearTimeout(timeout);
            if (error.name === 'AbortError' && retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                return this.generateContent(prompt, retryCount + 1, maxRetries);
            }
            throw error;
        }
    }
}

export default GeminiClient;
