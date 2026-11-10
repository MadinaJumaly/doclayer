import docToText from './docToText';

// Small helpers to build Tiptap JSON without repeating boilerplate.
const text = (s) => ({ type: 'text', text: s });
const para = (s) => ({ type: 'paragraph', content: [text(s)] });
const doc = (...content) => ({ type: 'doc', content });

test('headings become # lines (one # per level)', () => {
	const input = doc(
		{ type: 'heading', attrs: { level: 1 }, content: [text('Title')] },
		{ type: 'heading', attrs: { level: 2 }, content: [text('Part')] },
	);
	expect(docToText(input)).toBe('# Title\n\n## Part');
});

test('nested lists are indented under their parent item', () => {
	const input = doc({
		type: 'bulletList',
		content: [{
			type: 'listItem',
			content: [
				para('fruit'),
				{ type: 'orderedList', attrs: { start: 1 }, content: [{ type: 'listItem', content: [para('apple')] }] },
			],
		}],
	});
	expect(docToText(input)).toBe('- fruit\n  1. apple');
});

test('task items show whether they are checked', () => {
	const input = doc({
		type: 'taskList',
		content: [
			{ type: 'taskItem', attrs: { checked: true }, content: [para('done')] },
			{ type: 'taskItem', attrs: { checked: false }, content: [para('todo')] },
		],
	});
	expect(docToText(input)).toBe('- [x] done\n- [ ] todo');
});

test('tables become one | row | per line', () => {
	const cell = (s) => ({ type: 'tableCell', content: [para(s)] });
	const input = doc({
		type: 'table',
		content: [
			{ type: 'tableRow', content: [cell('A'), cell('B')] },
			{ type: 'tableRow', content: [cell('1'), cell('2')] },
		],
	});
	expect(docToText(input)).toBe('| A | B |\n| 1 | 2 |');
});

test('code blocks are wrapped in ``` fences', () => {
	const input = doc({ type: 'codeBlock', content: [text('# not a heading')] });
	expect(docToText(input)).toBe('```\n# not a heading\n```');
});

test('quotes start with >', () => {
	const input = doc({ type: 'blockquote', content: [para('wise words')] });
	expect(docToText(input)).toBe('> wise words');
});

test('empty paragraphs are dropped and blocks are separated by a blank line', () => {
	const input = doc(para('first'), { type: 'paragraph' }, para('second'));
	expect(docToText(input)).toBe('first\n\nsecond');
});
