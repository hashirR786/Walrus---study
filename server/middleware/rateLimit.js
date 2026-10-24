import rateLimit from 'express-rate-limit';

// These limiters key on the authenticated user rather than the IP address.
// Schools and colleges put hundreds of students behind a single NAT address, so
// an IP-keyed limit would let one student's mock test lock out their whole
// campus. That means every limiter here MUST be mounted after `protect`, which
// is what guarantees req.user exists.
const keyByUser = (req) => req.user._id.toString();

// The API answers errors as { error }, so keep 429 in the same shape.
const respondWithLimit = (message) => (req, res) => {
  res.status(429).json({ error: message });
};

// Burst guard for every AI endpoint: generous enough that ordinary studying
// never trips it, tight enough that a loop cannot drain the Groq/Gemini quota.
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 40,
  keyGenerator: keyByUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: respondWithLimit(
    'You are sending requests too quickly. Please wait a few minutes and try again.'
  ),
});

// Daily cap on full paper generation, the most expensive call in the app: a
// 180-minute paper is two LLM calls producing around 80 questions.
// The window is rolling, not calendar-based -- it resets 24h after the user's
// first generation, so the message must not promise a reset at midnight.
export const testGenerationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 15,
  keyGenerator: keyByUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: respondWithLimit(
    "You've reached your limit of 15 generated papers for now. This resets 24 hours " +
    'after your first paper. In the meantime you can use Quick Practice, or review ' +
    'your earlier attempts.'
  ),
});
