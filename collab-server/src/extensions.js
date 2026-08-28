// Schema-defining Tiptap extensions only (nodes/marks), used for HTML <-> Yjs
// conversion in server.js. The actual extension list lives in
// shared/tiptap-schema.js, the single source of truth shared with the
// client-side extensions in frontend/src/components/editor/DocEditor.jsx.
// Editor-behavior-only extensions (Placeholder, Collaboration,
// CollaborationCaret) are intentionally excluded here since they don't affect
// the document schema.
const { buildSchemaExtensions } = require('../../shared/tiptap-schema');
const StarterKit = require('@tiptap/starter-kit').default;
const Image = require('@tiptap/extension-image').default;
const { Table } = require('@tiptap/extension-table');
const TableRow = require('@tiptap/extension-table-row').default;
const TableHeader = require('@tiptap/extension-table-header').default;
const TableCell = require('@tiptap/extension-table-cell').default;
const TaskList = require('@tiptap/extension-task-list').default;
const TaskItem = require('@tiptap/extension-task-item').default;

const extensions = buildSchemaExtensions({
	StarterKit,
	Image,
	Table,
	TableRow,
	TableHeader,
	TableCell,
	TaskList,
	TaskItem,
});

module.exports = { extensions };
