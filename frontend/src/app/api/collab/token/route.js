import { NextResponse } from 'next/server';
import { getToken, performTokenRefresh } from '@/lib/auth';

function isExpired(token) {
	try {
		const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
		const now = Math.floor(Date.now() / 1000);
		return !payload.exp || payload.exp <= now;
	} catch {
		return true;
	}
}

export async function GET() {
	let token = await getToken();
	if (!token || isExpired(token)) {
		try {
			token = await performTokenRefresh();
		} catch {
			token = null;
		}
	}
	if (!token) {
		return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
	}
	return NextResponse.json({ token });
}
