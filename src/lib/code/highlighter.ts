import { codeToHtml } from 'shiki';

// Map file extensions to language identifiers
const extensionToLanguage: Record<string, string> = {
	// JavaScript/TypeScript
	js: 'javascript',
	jsx: 'jsx',
	ts: 'typescript',
	tsx: 'tsx',
	mjs: 'javascript',
	cjs: 'javascript',
	mts: 'typescript',
	cts: 'typescript',

	// Web
	html: 'html',
	htm: 'html',
	css: 'css',
	scss: 'scss',
	sass: 'sass',
	less: 'less',
	vue: 'vue',
	svelte: 'svelte',

	// Data
	json: 'json',
	jsonc: 'jsonc',
	json5: 'json5',
	yaml: 'yaml',
	yml: 'yaml',
	toml: 'toml',
	xml: 'xml',

	// Markdown
	md: 'markdown',
	mdx: 'mdx',

	// Backend
	py: 'python',
	rb: 'ruby',
	php: 'php',
	java: 'java',
	kt: 'kotlin',
	kts: 'kotlin',
	go: 'go',
	rs: 'rust',
	c: 'c',
	cpp: 'cpp',
	cc: 'cpp',
	cxx: 'cpp',
	h: 'c',
	hpp: 'cpp',
	cs: 'csharp',
	swift: 'swift',
	m: 'objective-c',
	mm: 'objective-cpp',

	// Shell
	sh: 'bash',
	bash: 'bash',
	zsh: 'zsh',
	fish: 'fish',
	ps1: 'powershell',

	// Database
	sql: 'sql',
	prisma: 'prisma',

	// Config
	env: 'dotenv',
	gitignore: 'gitignore',
	dockerfile: 'dockerfile',
	dockerignore: 'dockerignore',

	// Other
	graphql: 'graphql',
	gql: 'graphql',
	proto: 'protobuf',
	r: 'r',
	lua: 'lua',
	vim: 'vim',
	diff: 'diff',
	patch: 'diff'
};

export function inferLanguageFromFilename(filename: string): string | undefined {
	// Get extension from filename
	const parts = filename.split('.');
	const extension = parts[parts.length - 1]?.toLowerCase();

	// Special cases for files without extension or special names
	const specialFiles: Record<string, string> = {
		dockerfile: 'dockerfile',
		makefile: 'makefile',
		rakefile: 'ruby',
		gemfile: 'ruby',
		podfile: 'ruby'
	};

	const lowerFilename = filename.toLowerCase();
	if (specialFiles[lowerFilename]) {
		return specialFiles[lowerFilename];
	}

	// Return language based on extension
	return extension ? extensionToLanguage[extension] : undefined;
}

export async function highlightCode(
	code: string,
	lang?: string,
	theme: string = 'vitesse-dark'
): Promise<string> {
	try {
		const html = await codeToHtml(code, {
			lang: lang || 'plaintext',
			theme
		});
		return html;
	} catch (error) {
		console.error('Syntax highlighting failed:', error);
		// Fallback to plain code
		return `<pre><code>${escapeHtml(code)}</code></pre>`;
	}
}

function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, (m) => map[m]);
}
