/**
 * Wraps a Vercel function handler so an unexpected throw becomes a JSON 500
 * instead of the platform's own plain-text crash page — which the frontend
 * can't parse as JSON, turning a real error into a confusing "Unexpected
 * token" SyntaxError on the client.
 */
export function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'internal_error', message: err.message });
      }
    }
  };
}
