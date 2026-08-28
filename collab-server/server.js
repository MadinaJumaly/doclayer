require('dotenv').config();

const { Server } = require('@hocuspocus/server');
const { TiptapTransformer } = require('@hocuspocus/transformer');
const { generateJSON, generateHTML } = require('@tiptap/html/server');
const Y = require('yjs');

const { extensions } = require('./src/extensions');
const { verifyAccessToken } = require('./src/auth');
const { getDocument, updateDocument } = require('./src/djangoClient');

const FIELD_NAME = 'default';

const server = new Server({
	port: process.env.PORT ? Number(process.env.PORT) : 1234,
	debounce: 3000,
	maxDebounce: 15000,

	async onAuthenticate({ token, documentName }) {
		const payload = verifyAccessToken(token);
		const doc = await getDocument(documentName, token);
		return { userId: payload.user_id, token, title: doc.title };
	},

	async onLoadDocument({ documentName, document, context }) {
		// Guard against hydrating a room that already has synced content -
		// without this, any path that ends up calling onLoadDocument twice
		// for the same room (reconnect races, etc.) silently double-inserts
		// the persisted HTML, since each conversion produces a structurally
		// independent Y.Doc that Yjs has no way to dedupe against the first.
		if (document.getXmlFragment(FIELD_NAME).length > 0) {
			return;
		}
		const doc = await getDocument(documentName, context.token);
		if (!doc.content) {
			return;
		}
		const json = generateJSON(doc.content, extensions);
		const converted = TiptapTransformer.toYdoc(json, FIELD_NAME, extensions);
		Y.applyUpdate(document, Y.encodeStateAsUpdate(converted));
	},

	async onStoreDocument({ documentName, document, lastContext }) {
		const json = TiptapTransformer.fromYdoc(document, FIELD_NAME);
		const html = generateHTML(json, extensions);
		await updateDocument(documentName, lastContext.token, {
			title: lastContext.title,
			content: html,
		});
	},
});

server.listen();
