exports.handler = async function () {
  return {
    statusCode: 200,
    body: JSON.stringify({
      key: process.env.GEMINI_API_KEY,
    }),
  };
};
