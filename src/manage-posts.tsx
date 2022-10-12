import { ActionPanel, Action, List, useNavigation, Icon, Color } from '@raycast/api';
import { useState } from "react";
import { type MarkdownFile, getCategorizedPosts } from "./blog";
import NewPost from "./new-post";
import fs from "fs";


export default function Command() {
	const [files, setFiles] = useState(getCategorizedPosts());


	function refreshFiles() {
		setFiles(getCategorizedPosts());
	}

	return (
		<List>
			{Object.entries(files).length === 0 && (
				<List.EmptyView
					title="Couldn't find any .md or .mdx files!"
					description=""
				/>
			)}

			{Object.keys(files).map((category) => (
				<List.Section title={category} key={category}>
					{files[category].map((file) => MarkdownFile(file, refreshFiles))}
				</List.Section>
			))}
		</List>
	);
}

function MarkdownFile(file: MarkdownFile, refreshFiles: () => void) {
	const { push } = useNavigation();

	function publishPost() {
		const publishPath = file.path.replace("/draft/", "/public/");

		let content = fs.readFileSync(file.path, "utf8");
		const today = new Date().toISOString().split("T")[0];
		content = content.replace(/^date:.*$/gim, `date: ${today}`);
		fs.writeFileSync(publishPath, content);
		fs.unlinkSync(file.path);

		refreshFiles();
	}

	return (
		<List.Item
			key={file.path}
			keywords={file.keywords}
			title={file.prettyName}
			subtitle={file.name}
			icon={file.draft ? { source: Icon.CircleProgress75, tintColor: Color.SecondaryText } : { source: Icon.CircleProgress100, tintColor: Color.Green }}
			accessories={[
				{
					date: file.lastModifiedAt,
					tooltip: `Last modified: ${file.lastModifiedAt.toLocaleString()}`,
				},
			]}
			actions={
				<ActionPanel>
					<ActionPanel.Section>
						<Action.Open title="Open File" target={file.path} />
						<Action.ShowInFinder path={file.path} />
						<Action icon={Icon.NewDocument} title="Create a new blog post" shortcut={{ modifiers: ["cmd"], key: "n" }} onAction={() => push(<NewPost />)} />
						<Action.OpenWith path={file.path} shortcut={{ modifiers: ["cmd"], key: "o" }} />
						{file.draft && (<Action icon={{ source: Icon.PlusCircleFilled, tintColor: Color.Green }} title={`Publish "${file.name}"`} shortcut={{ modifiers: ["cmd"], key: "s" }} onAction={publishPost} />)}
					</ActionPanel.Section>
					<ActionPanel.Section>
						<Action.Trash
							title="Delete File"
							paths={file.path}
							shortcut={{ modifiers: ["cmd"], key: "backspace" }}
							onTrash={refreshFiles}
						/>
					</ActionPanel.Section>
				</ActionPanel>
			}
		/>
	);
}