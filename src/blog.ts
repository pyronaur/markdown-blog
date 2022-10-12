import { statSync } from "fs";
import path from "path";
import preferences from "./preferences";
import { getRecursiveFiles, getRecursiveDirectories } from "./utils";
export type MarkdownFile = {
	name: string;
	draft: boolean;
	path: string;
	category: string;
	prettyName: string;
	lastModifiedAt: Date;
	keywords: string[];
};

export type CategorizedFiles = {
	[key: string]: MarkdownFile[];
};

function prettifyFileName(name: string) {
	return name
		.replace(/_/g, " ")
		.replace(/-/g, " ")
		.replace(/\.mdx?$/, "")
		.replace(/\b\w/g, (l) => l.toUpperCase());
}

function pathToPost(filepath: string, draft: boolean): MarkdownFile {
	const name = path.basename(filepath);
	const category = path.basename(path.dirname(filepath));
	return {
		name,
		category,
		draft,
		path: filepath,
		prettyName: prettifyFileName(name),
		lastModifiedAt: statSync(filepath).mtime,
		keywords: [category + name],
	};
}

export function getPosts(): MarkdownFile[] {
	const content = getRecursiveFiles(preferences().contentPath);
	const drafts = getRecursiveFiles(preferences().draftsPath);

	return [
		...drafts.map((path) => pathToPost(path, true)),
		...content.map((path) => pathToPost(path, false)),
	].sort((a, b) => b.lastModifiedAt.getTime() - a.lastModifiedAt.getTime());
}

export function getCategorizedPosts() {
	const files = getPosts();

	const categories = files.reduce((acc, file) => {
		if (!acc[file.category]) {
			acc[file.category] = [];
		}
		acc[file.category].push(file);
		return acc;
	}, {} as Record<string, MarkdownFile[]>);

	return categories;
}

export function categories(): string[] {
	const { draftsPath, contentPath } = preferences();

	const paths = [draftsPath, contentPath];

	const categories = new Set<string>();
	return Array.from(
		paths.reduce((acc, path) => {
			const directories = getRecursiveDirectories(path);
			directories.forEach((dir) => acc.add(dir));
			return acc;
		}, categories)
	).map((dir) => path.basename(dir));
}
