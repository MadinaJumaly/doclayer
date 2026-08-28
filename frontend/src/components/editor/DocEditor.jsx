"use client"

import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';

import { useAuth } from '@/components/authProvider';
import Toolbar from './Toolbar';
import { buildSchemaExtensions } from '../../../../shared/tiptap-schema';

const schemaExtensions = buildSchemaExtensions({
	StarterKit,
	Image,
	Table,
	TableRow,
	TableHeader,
	TableCell,
	TaskList,
	TaskItem,
});

function randomColor() {
	const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#e879f9'];
	return colors[Math.floor(Math.random() * colors.length)];
}

async function fetchCollabToken() {
	const response = await fetch('/api/collab/token');
	if (!response.ok) {
		throw new Error('Invalid collaboration token');
	}
	const data = await response.json();
	return data.token;
}

const DocEditor = forwardRef(function DocEditor({ initialData, placeholder, onSave, docId }, ref) {
	const { username } = useAuth() || {};

	const ydoc = useMemo(() => new Y.Doc(), [docId]);
	const provider = useMemo(() => {
		return new HocuspocusProvider({
			url: process.env.NEXT_PUBLIC_COLLAB_WS_URL,
			name: docId,
			document: ydoc,
			token: fetchCollabToken,
		});
	}, [docId, ydoc]);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			...schemaExtensions,
			Placeholder.configure({ placeholder }),
			Collaboration.configure({ document: ydoc }),
			CollaborationCaret.configure({
				provider,
				user: { name: username || 'Anonymous', color: randomColor() },
			}),
		],
		editorProps: {
			attributes: {
				class:
					'prose prose-sm sm:prose-base dark:prose-invert max-w-none border rounded-md p-4 min-h-[300px] focus:outline-none',
			},
		},
	}, [docId]);

	useEffect(() => {
		return () => {
			provider.destroy();
			ydoc.destroy();
		};
	}, [provider, ydoc]);

	useImperativeHandle(ref, () => ({
		getHTML: () => editor?.getHTML() ?? '',
	}), [editor]);

	return (
		<div className="doc-editor">
			{editor && <Toolbar editor={editor} />}
			<EditorContent editor={editor} />
		</div>
	);
});

export default DocEditor;
