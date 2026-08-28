// Single source of truth for the Tiptap extensions that define the DOCUMENT SCHEMA
// (as opposed to editor-behavior-only extensions like Placeholder, Collaboration,
// CollaborationCaret, which are legitimately client-only and configured separately
// in frontend/src/components/editor/DocEditor.jsx).
//
// Used by both frontend/src/components/editor/DocEditor.jsx (Tiptap editor instance)
// and collab-server/src/extensions.js (server-side HTML <-> Yjs conversion via
// @tiptap/html + @tiptap/transformer). Keeping this in one place means the two
// can never drift out of sync and silently drop content on save/hydrate.
//
// This module takes the already-imported Tiptap extension classes as arguments
// rather than importing @tiptap/* itself, so it has no dependencies of its own and
// needs no node_modules at its location (it lives outside both services' own
// package.json/node_modules).
//
// Note: StarterKit bundles Link and Underline by default in both consumers today.
// If either side ever overrides StarterKit with `link: false` or `underline: false`,
// do the same on the other side here, or the two schemas will silently diverge.
function buildSchemaExtensions({ StarterKit, Image, Table, TableRow, TableHeader, TableCell, TaskList, TaskItem }) {
	return [
		StarterKit.configure({ undoRedo: false }),
		Image,
		Table.configure({ resizable: true }),
		TableRow,
		TableHeader,
		TableCell,
		TaskList,
		TaskItem.configure({ nested: true }),
	];
}

module.exports = { buildSchemaExtensions };
