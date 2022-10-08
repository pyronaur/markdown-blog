import { ActionPanel, Action, List } from "@raycast/api";
import { useState } from "react";
import { type MarkdownFile, getCategorizedPosts } from "./blog";


export default function Command() {
	const [files, setFiles] = useState(getCategorizedPosts());

	function handleTrash() {
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
					{files[category].map((file) => MarkdownFile(file, handleTrash))}
				</List.Section>
			))}
		</List>
	);
}

function MarkdownFile(file: MarkdownFile, handleTrash: () => void) {

	return (
		<List.Item
			key={file.path}
			keywords={file.keywords}
			title={file.prettyName}
			subtitle={file.name}
			icon={{ fileIcon: file.path }}

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
						<Action.OpenWith path={file.path} shortcut={{ modifiers: ["cmd"], key: "o" }} />
					</ActionPanel.Section>
					<ActionPanel.Section>
						<Action.Trash
							title="Delete File"
							paths={file.path}
							shortcut={{ modifiers: ["cmd"], key: "backspace" }}
							onTrash={handleTrash}
						/>
					</ActionPanel.Section>
				</ActionPanel>
			}
		/>
	);
}