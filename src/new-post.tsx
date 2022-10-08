import { Form, ActionPanel, Action, popToRoot, showToast, Toast, open } from '@raycast/api';
import { categories, getPosts } from './blog';
import fs from 'fs';
import preferences from "./preferences";
import { useEffect, useState, useRef } from 'react';
import path from "path";

interface Post {
	title: string;
	excerpt: string;
	category: string;
	date: string;
	content: string;
}

function getTemplate(category: string) {
	const templatePath = `${preferences().draftsPath}/${category}/.template.md`;
	if (category && fs.existsSync(templatePath)) {
		return fs.readFileSync(templatePath, 'utf8');
	}
	const defaultTemplatePath = `${preferences().draftsPath}/.template.md`;
	if (fs.existsSync(defaultTemplatePath)) {
		return fs.readFileSync(defaultTemplatePath, 'utf8');
	}


	return '';
}
function titleToSlug(title: string) {
	return title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
}

export default function Command() {

	const [excerpt, setExcerpt] = useState('');
	const [title, setTitle] = useState('');
	const [category, setCategory] = useState('');
	const [preview, setPreview] = useState('');
	const previewRef = useRef<Form.TextArea>(null);

	const [titleError, setTitleError] = useState<string | undefined>();

	useEffect(() => {
		let template = getTemplate(category);

		template = template.replaceAll("__title__", title);
		template = template.replaceAll("__excerpt__", excerpt);
		template = template.replaceAll("__date__", new Date().toISOString().split('T')[0]);

		setPreview(template);

	}, [category, title, excerpt]);

	useEffect(() => {
		previewRef.current?.reset()
	}, [preview])

	async function handleSubmit(values: Post): Promise<boolean> {

		if (!validateTitle(values.title)) {
			return false;
		}

		const content = values.content;
		const slug = titleToSlug(values.title);
		let category = '';

		if (values.category) {
			category = values.category + '/';
		}
		const path = `${preferences().draftsPath}/${category}${slug}.md`;

		fs.writeFileSync(path, content);

		await showToast({
			style: Toast.Style.Success,
			title: "Success",
			message: `Created ${path}`,
		});

		await open(path);
		popToRoot();

		return true;
	}

	function validateTitle(title: string | undefined) {


		if (!title || title.length === 0) {
			setTitleError("Title is required");
			return false;
		}

		const slug = titleToSlug(title);
		const posts = getPosts();

		const existingPost = posts.find(post => post.name.replace(/\.mdx?$/, '').endsWith(slug));
		if (existingPost) {
			showToast({
				style: Toast.Style.Failure,
				title: "Post already exists",
				message: `${path.basename(path.dirname(existingPost.path))}/${existingPost.name}`,
			});

			setTitleError("Post Already Exists!");
			return false;
		}

		setTitleError(undefined);
		return true;
	}

	function updateTitle(value: string) {
		setTitle(value)
		setTitleError(undefined)
	}



	return (
		<Form
			enableDrafts
			actions={
				<ActionPanel>
					<Action.SubmitForm
						onSubmit={handleSubmit}
					/>
				</ActionPanel>
			}
		>
			<Form.TextField
				id="title"
				title="Title"
				defaultValue="Post Title"
				onChange={updateTitle}
				error={titleError}
				onBlur={(async e => await validateTitle(e.target.value))} />
			<Form.TextField id="excerpt" title="Excerpt" defaultValue="A new draft has been created." onChange={setExcerpt} />
			<Form.Dropdown id="category" title="Category" defaultValue="" onChange={setCategory}>
				<Form.Dropdown.Item value="" title="None" />
				{categories().map((category) => (
					<Form.Dropdown.Item key={category} value={category} title={category} />
				))}
			</Form.Dropdown>
			<Form.Separator />
			<Form.Description
				text="A new markdown file will be created in your drafts folder. with the following content:"
			/>
			<Form.TextArea
				id="content"
				title="Preview"
				enableMarkdown={true}
				defaultValue={preview}
				ref={previewRef}
			/>
		</Form>
	);
}

// function Template(template: string) {

// }