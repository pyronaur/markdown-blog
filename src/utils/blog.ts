import { statSync } from 'fs';
import path from 'path';
import preferences from './preferences';
import { getRecursiveFiles, getRecursiveDirectories, filenameToTitle } from './utils';
import fs from 'fs-extra';

export type MarkdownFile = {
	name: string;
	draft: boolean;
	path: string;
	category: string;
	title: string;
	lastModifiedAt: Date;
	keywords: string[];
};

export type CategorizedPosts = {
	[category: string]: MarkdownFile[];
};

/**
 * Convert a file path to a MarkdownFile object
 */
function pathToPost(filepath: string, draft: boolean): MarkdownFile {
	const name = path.basename(filepath);
	const contentPaths = [preferences().publicPath, preferences().draftsPath];
	const relativePath = contentPaths.reduce((acc, root) => {
		return acc.replace(root, '');
	}, filepath);

	const category = path.basename(path.dirname(relativePath)) || 'Uncategorized';
	return {
		name,
		category,
		draft,
		path: filepath,
		title: filenameToTitle(name),
		lastModifiedAt: statSync(filepath).mtime,
		keywords: [category + name],
	};
}

/**
 * Get Public and Draft posts
 */
export function getPosts(): MarkdownFile[] {
	const published = getRecursiveFiles(preferences().publicPath);
	const drafts = getRecursiveFiles(preferences().draftsPath);

	return [
		...drafts.map((path) => pathToPost(path, true)),
		...published.map((path) => pathToPost(path, false)),
	].sort((a, b) => b.lastModifiedAt.getTime() - a.lastModifiedAt.getTime());
}

/**
 * Organize posts by category
 */
export function getCategorizedPosts(): CategorizedPosts {
	const files = getPosts();

	const categories = files.reduce((acc, file) => {
		if (!acc[file.category]) {
			acc[file.category] = [];
		}
		acc[file.category].push(file);
		return acc;
	}, {} as CategorizedPosts);

	return categories;
}

/**
 * Get all the categories in the content directory
 *
 * @returns {string[]}
 * For example:
 * - /content/drafts/my-category/my-post.md
 * - /content/drafts/my-category/my-other-post.md
 * - /content/public/my-other-category/my-post.md
 *
 * Will return:
 * - ['my-category', 'my-other-category']
 */
export function categories(): string[] {
	const { draftsPath, publicPath } = preferences();

	const paths = [draftsPath, publicPath];

	const categories = new Set<string>();
	return Array.from(
		paths.reduce((acc, path) => {
			const directories = getRecursiveDirectories(path);
			directories.forEach((dir) => acc.add(dir));
			return acc;
		}, categories)
	).map((dir) => path.basename(dir));
}

export function publishPost(post: MarkdownFile): void {
	const { draftsPath, publicPath } = preferences();

	if (!post.path.startsWith(draftsPath)) {
		throw new Error(`Cannot publish post that is not in drafts directory`);
	}

	const newPostPath = post.path.replace(draftsPath, publicPath);

	// Set the current date in the post content.
	const content = fs.readFileSync(post.path, 'utf8');
	const today = new Date().toISOString().split('T')[0];
	const updatedContent = content.replace(/^date:.*$/gim, `date: ${today}`);

	fs.ensureDirSync(path.dirname(newPostPath));
	fs.writeFileSync(newPostPath, updatedContent);
	fs.unlinkSync(post.path);
}
