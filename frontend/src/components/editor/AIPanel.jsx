"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const ERRORS = {
	401: 'Your session expired. Please log in again.',
	502: 'The AI service is unavailable right now. Try again in a moment.',
};

export default function AIPanel({ editorRef }) {
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [answer, setAnswer] = useState(null);
	const [error, setError] = useState('');

	async function ask(event) {
		event.preventDefault();
		const q = query.trim();
		if (!q || loading) return;

		setLoading(true);
		setError('');
		setAnswer(null);
		const context = editorRef.current?.getAIContext?.() ?? { text: '', selection: '' };

		try {
			const response = await fetch('/api/ai/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: q, context }),
			});
			if (!response.ok) {
				setError(ERRORS[response.status] || `Request failed (${response.status}).`);
				return;
			}
			setAnswer(await response.json());
		} catch {
			setError('Could not reach the server.');
		} finally {
			setLoading(false);
		}
	}

	function onKeyDown(event) {
		if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) ask(event);
	}

	return (
		<section className="border rounded-md p-4 space-y-3" aria-label="AI assistant">
			<h2 className="text-lg font-semibold">Ask AI about this document</h2>
			<form onSubmit={ask} className="space-y-2">
				<Textarea
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={onKeyDown}
					placeholder="e.g. Summarize this document, or select text and ask to rewrite it"
					rows={3}
				/>
				<div className="flex items-center gap-3">
					<Button type="submit" disabled={loading || !query.trim()}>
						{loading ? 'Thinking…' : 'Ask'}
					</Button>
					<span className="text-xs text-muted-foreground">Ctrl/⌘ + Enter. Selected text is included.</span>
				</div>
			</form>

			{error && (
				<div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">{error}</div>
			)}

			{answer && (
				<div className="space-y-2">
					<p className="whitespace-pre-wrap text-sm">{answer.message}</p>
					{answer.sources?.length > 0 && (
						<details className="text-sm">
							<summary className="cursor-pointer text-muted-foreground">
								Sources ({answer.sources.length})
							</summary>
							<ul className="mt-2 space-y-2">
								{answer.sources.map((src, i) => (
									<li key={i} className="border-l-2 pl-3 text-muted-foreground whitespace-pre-wrap">
										{src.length > 400 ? src.slice(0, 400) + '…' : src}
									</li>
								))}
							</ul>
						</details>
					)}
				</div>
			)}
		</section>
	);
}
