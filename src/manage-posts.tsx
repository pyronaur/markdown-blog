import { ActionPanel, Action, List, useNavigation, Icon, Color } from "@raycast/api";
import { useState, useEffect } from "react";
import { type MarkdownFile, getCategorizedPosts } from "./blog";
import NewPost from "./new-post";
import fs from "fs";
import { capitalize } from "./utils";

const filters = {
  all: () => true,
  published: (file: MarkdownFile) => !file.draft,
  drafts: (file: MarkdownFile) => file.draft
};

type AvailableFilters = keyof typeof filters;

function getFilteredPosts(filterName: AvailableFilters) {
  const posts = getCategorizedPosts();
  for (const [key, group] of Object.entries(posts)) {
    posts[key] = group.filter(filters[filterName]);
  }

  return posts;
}

export default function Command() {
  const [filter, setFilter] = useState<AvailableFilters>("all");
  const [files, setFiles] = useState<Record<string, MarkdownFile[]>>(getFilteredPosts(filter));
  const { push } = useNavigation();
  const newPostAction = () => push(<NewPost />);

  function refreshFiles() {
    setFiles(getCategorizedPosts());
  }

  useEffect(() => {
    setFiles(getFilteredPosts(filter));
  }, [filter]);

  const categories = Object.keys(files);
  return (
    <List
      navigationTitle="Browse Posts"
      searchBarAccessory={<StatusDropdown files={files} onFilterChange={setFilter} />}
    >
      {categories.length === 0 && (
        <List.EmptyView title="Couldn't find any .md or .mdx files!" description="" />
      )}

      {categories.length !== 0 &&
        categories.map((category) => (
          <List.Section title={capitalize(category)} key={category}>
            {category in files &&
              files[category].map((file) => (
                <Post file={file} refreshFiles={refreshFiles} push={newPostAction} />
              ))}
          </List.Section>
        ))}
    </List>
  );
}

function StatusDropdown(props) {
  const { files, onFilterChange } = props;

  return (
    <List.Dropdown tooltip="Select Post Status" storeValue={true} onChange={onFilterChange}>
      <List.Dropdown.Item key="all" title="All" value="all" />
      <List.Dropdown.Item key="published" title="Published" value="published" />
      <List.Dropdown.Item key="draft" title="Drafts" value="drafts" />
    </List.Dropdown>
  );
}

function Post(props) {
  const file: MarkdownFile = props.file;
  const refreshFiles = props.refreshFiles;
  const newPost = props.newPost;

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
      icon={
        file.draft
          ? { source: Icon.CircleProgress75, tintColor: Color.SecondaryText }
          : { source: Icon.CircleProgress100, tintColor: Color.Green }
      }
      accessories={[
        {
          date: file.lastModifiedAt,
          tooltip: `Last modified: ${file.lastModifiedAt.toLocaleString()}`
        }
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Open title="Open File" target={file.path} />
            <Action.ShowInFinder path={file.path} />
            <Action
              icon={Icon.NewDocument}
              title="Create a new blog post"
              shortcut={{ modifiers: ["cmd"], key: "n" }}
              onAction={newPost}
            />
            <Action.OpenWith path={file.path} shortcut={{ modifiers: ["cmd"], key: "o" }} />
            {file.draft && (
              <Action
                icon={{ source: Icon.PlusCircleFilled, tintColor: Color.Green }}
                title={`Publish "${file.name}"`}
                shortcut={{ modifiers: ["cmd"], key: "s" }}
                onAction={publishPost}
              />
            )}
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
