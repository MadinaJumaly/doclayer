const jwt = require('jsonwebtoken');

const DJANGO_SECRET_KEY = process.env.DJANGO_SECRET_KEY;

// Django's ninja-jwt signs access tokens with SECRET_KEY (HS256) by default -
// verify locally rather than round-tripping to Django on every socket
// (re)connect, since access tokens are short-lived (15 min) and reconnects
// are frequent. Per-document authorization is still delegated to Django
// (see djangoClient.js) so permission rules aren't duplicated here.
function verifyAccessToken(token) {
	if (!token) {
		throw new Error('Missing token');
	}
	const payload = jwt.verify(token, DJANGO_SECRET_KEY, { algorithms: ['HS256'] });
	if (payload.token_type !== 'access') {
		throw new Error('Not an access token');
	}
	return payload;
}

module.exports = { verifyAccessToken };
