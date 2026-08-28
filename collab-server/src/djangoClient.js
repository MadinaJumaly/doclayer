const DJANGO_API_URL = (process.env.DJANGO_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

async function getDocument(documentId, token) {
	const response = await fetch(`${DJANGO_API_URL}/documents/${documentId}/`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!response.ok) {
		throw new Error(`Not authorized for document ${documentId} (${response.status})`);
	}
	return response.json();
}

async function updateDocument(documentId, token, { title, content }) {
	const response = await fetch(`${DJANGO_API_URL}/documents/${documentId}/`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ title, content }),
	});
	if (!response.ok) {
		throw new Error(`Failed to store document ${documentId} (${response.status})`);
	}
	return response.json();
}

module.exports = { getDocument, updateDocument };
