import { render, screen, fireEvent } from '@testing-library/react';
import AIPanel from './AIPanel';

// A fake editor: the panel only needs getAIContext() from it.
const editorRef = { current: { getAIContext: () => ({ text: '# Doc', selection: '' }) } };

function renderPanelAndAsk(question = 'Summarize this') {
	render(<AIPanel editorRef={editorRef} />);
	fireEvent.change(screen.getByRole('textbox'), { target: { value: question } });
	fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
}

afterEach(() => {
	delete global.fetch;
});

test('Ask button is disabled while the question box is empty', () => {
	render(<AIPanel editorRef={editorRef} />);
	const button = screen.getByRole('button', { name: 'Ask' });

	expect(button).toBeDisabled();
	fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
	expect(button).toBeEnabled();
});

test('shows a loading state while waiting for the answer', () => {
	global.fetch = jest.fn(() => new Promise(() => {})); // never resolves
	renderPanelAndAsk();

	expect(screen.getByRole('button', { name: 'Thinking…' })).toBeDisabled();
});

test('sends the question with the document and shows the answer and sources', async () => {
	global.fetch = jest.fn().mockResolvedValue({
		ok: true,
		json: async () => ({ message: 'It is about taxes.', sources: ['Tax returns are due in April.'] }),
	});
	renderPanelAndAsk();

	expect(await screen.findByText('It is about taxes.')).toBeInTheDocument();
	expect(screen.getByText('Sources (1)')).toBeInTheDocument();
	expect(screen.getByText('Tax returns are due in April.')).toBeInTheDocument();

	const body = JSON.parse(global.fetch.mock.calls[0][1].body);
	expect(body).toEqual({ query: 'Summarize this', context: { text: '# Doc', selection: '' } });
});

test('shows an error message when the request fails', async () => {
	global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 502 });
	renderPanelAndAsk();

	expect(await screen.findByText(/AI service is unavailable/)).toBeInTheDocument();
});
