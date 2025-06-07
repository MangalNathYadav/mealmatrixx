fetch("/.netlify/functions/getGeminiKey")
  .then((res) => res.json())
  .then((data) => {
    geminiApiKey= data.key;
    // Now use GEMINI_API_KEY in your AI code
  });
