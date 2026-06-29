const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function getTurnstileSecret() {
  return process.env.TURNSTILE_SECRET_KEY;
}

async function verifyTurnstileToken(token, remoteip) {
  if (!token) return { success: false, error: 'Missing Turnstile token' };
  const secret = getTurnstileSecret();
  if (!secret) return { success: false, error: 'Turnstile secret key not configured' };

  try {
    const body = new URLSearchParams({
      secret: secret,
      response: token,
    });
    if (remoteip) body.append('remoteip', remoteip);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await res.json();
    return { success: data.success, error: data['error-codes']?.join(', ') || null };
  } catch (err) {
    console.error('Turnstile verification error:', err);
    return { success: false, error: 'Verification service unavailable' };
  }
}

function turnstileMiddleware(req, res, next) {
  const token = req.body?.turnstileToken || req.body?.cfTurnstileResponse;
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;

  verifyTurnstileToken(token, ip).then((result) => {
    if (result.success) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Bot verification failed. Please try again.',
        error: result.error,
      });
    }
  });
}

export { turnstileMiddleware, verifyTurnstileToken };
