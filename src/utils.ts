import { readdirSync, statSync } from "fs";
import path from "path";

export function getDirectories(files: string[]) {
	return files.filter((file) => {
		return statSync(file).isDirectory();
	});
}

export function getFiles(files: string[]): string[] {
	return files.filter((file) => statSync(file).isFile());
}

export function getDirectoryContents(dir: string) {
	return readdirSync(dir)
		.filter((file) => {
			return file !== ".DS_Store" && file !== "node_modules" && !file.startsWith(".");
		})
		.map((file) => path.join(dir, file));
}

export function getRecursiveFiles(dir: string, depth = 0): string[] {
	if (depth > 3) {
		return [];
	}

	const contents = getDirectoryContents(dir);
	const directories = getDirectories(contents);
	const results = getFiles(contents);

	directories.forEach((path) => {
		results.push(...getRecursiveFiles(path, ++depth));
	});

	return results;
}

export function getRecursiveDirectories(dir: string, depth = 0): string[] {
	if (depth > 3) {
		return [];
	}
	const contents = getDirectoryContents(dir);
	const directories = getDirectories(contents);

	const results = getDirectories(contents);
	directories.forEach((path) => {
		results.push(...getRecursiveDirectories(path, ++depth));
	});

	return directories;
}
