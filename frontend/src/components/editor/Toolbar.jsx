"use client"

import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	ListTodo,
	Quote,
	Code,
	Link as LinkIcon,
	Image as ImageIcon,
	Table as TableIcon,
	Minus,
	Undo,
	Redo,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

function ToolbarButton({ onClick, active, disabled, label, children }) {
	return (
		<Button
			type="button"
			variant={active ? 'secondary' : 'ghost'}
			size="icon"
			disabled={disabled}
			onClick={onClick}
			aria-label={label}
			title={label}
		>
			{children}
		</Button>
	);
}

export default function Toolbar({ editor }) {
	if (!editor) {
		return null;
	}

	const setLink = () => {
		const previousUrl = editor.getAttributes('link').href;
		const url = window.prompt('URL', previousUrl || 'https://');
		if (url === null) {
			return;
		}
		if (url === '') {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	};

	const addImage = () => {
		const url = window.prompt('Image URL');
		if (url) {
			editor.chain().focus().setImage({ src: url }).run();
		}
	};

	const addTable = () => {
		editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
	};

	return (
		<div className="doc-editor-toolbar flex flex-wrap items-center gap-1 border rounded-md p-1 mb-2">
			<ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
				<Bold />
			</ToolbarButton>
			<ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
				<Italic />
			</ToolbarButton>
			<ToolbarButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
				<Underline />
			</ToolbarButton>
			<ToolbarButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
				<Strikethrough />
			</ToolbarButton>
			<ToolbarButton label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
				<Code />
			</ToolbarButton>

			<span className="w-px h-6 bg-border mx-1" />

			<ToolbarButton label="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
				<Heading1 />
			</ToolbarButton>
			<ToolbarButton label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
				<Heading2 />
			</ToolbarButton>
			<ToolbarButton label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
				<Heading3 />
			</ToolbarButton>

			<span className="w-px h-6 bg-border mx-1" />

			<ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
				<List />
			</ToolbarButton>
			<ToolbarButton label="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
				<ListOrdered />
			</ToolbarButton>
			<ToolbarButton label="Task list" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
				<ListTodo />
			</ToolbarButton>
			<ToolbarButton label="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
				<Quote />
			</ToolbarButton>
			<ToolbarButton label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
				<Code />
			</ToolbarButton>

			<span className="w-px h-6 bg-border mx-1" />

			<ToolbarButton label="Link" active={editor.isActive('link')} onClick={setLink}>
				<LinkIcon />
			</ToolbarButton>
			<ToolbarButton label="Image" onClick={addImage}>
				<ImageIcon />
			</ToolbarButton>
			<ToolbarButton label="Table" onClick={addTable}>
				<TableIcon />
			</ToolbarButton>
			<ToolbarButton label="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
				<Minus />
			</ToolbarButton>

			<span className="w-px h-6 bg-border mx-1" />

			<ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
				<Undo />
			</ToolbarButton>
			<ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
				<Redo />
			</ToolbarButton>
		</div>
	);
}
