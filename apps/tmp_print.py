from pathlib import Path
text = Path(''docs/sprint-artifacts/1-1-home-feed-sorting.md'').read_text(encoding=''utf-8'')
start = text.index(''## Tasks / Subtasks'')
end = text.index(''## Dev Notes'')
print(''START'', start, ''END'', end)
print(text[start:end])
