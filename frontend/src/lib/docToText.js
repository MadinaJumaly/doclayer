// Serializes a Tiptap/ProseMirror JSON document into Markdown-style plain text
// for the AI endpoint. Headings become "# ..." lines (the backend's get_outline
// relies on that) and blocks are separated by blank lines (the backend's
// chunk_text splits on them). Formatting marks are dropped; only text matters.

function inlineText(node) {
	if (!node) return '';
	if (node.type === 'text') return node.text || '';
	if (node.type === 'hardBreak') return '\n';
	if (node.type === 'image') return node.attrs?.alt ? `[image: ${node.attrs.alt}]` : '';
	return (node.content || []).map(inlineText).join('');
}

function blockText(node, indent = '') {
	const children = node.content || [];
	switch (node.type) {
		case 'heading':
			return `${'#'.repeat(node.attrs?.level || 1)} ${inlineText(node)}`;
		case 'paragraph':
			return indent + inlineText(node);
		case 'blockquote':
			return children.map((c) => `> ${blockText(c)}`).join('\n');
		case 'codeBlock':
			return '```\n' + inlineText(node) + '\n```';
		case 'horizontalRule':
			return '---';
		case 'image':
			return inlineText(node);
		case 'bulletList':
		case 'orderedList':
		case 'taskList':
			return children
				.map((item, i) => {
					const marker =
						node.type === 'orderedList'
							? `${(node.attrs?.start || 1) + i}.`
							: node.type === 'taskList'
								? `- [${item.attrs?.checked ? 'x' : ' '}]`
								: '-';
					return listItemText(item, indent, marker);
				})
				.join('\n');
		case 'table':
			return children
				.map((row) => '| ' + (row.content || []).map((cell) => inlineText(cell).trim()).join(' | ') + ' |')
				.join('\n');
		default:
			return children.length ? children.map((c) => blockText(c, indent)).join('\n') : inlineText(node);
	}
}

function listItemText(item, indent, marker) {
	const [first, ...rest] = item.content || [];
	const head = `${indent}${marker} ${first ? inlineText(first) : ''}`;
	const nested = rest.map((c) => blockText(c, indent + '  '));
	return [head, ...nested].join('\n');
}

export default function docToText(json) {
	return (json?.content || [])
		.map((node) => blockText(node))
		.filter((block) => block.trim() !== '')
		.join('\n\n');
}
