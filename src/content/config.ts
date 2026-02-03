import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	// schema: ({ image }) => z.object({
    schema: z.object({
		title: z.string(),
		description: z.string(),
		// Transform string to Date object
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
        tags: z.array(z.string()).optional(),
	}),
});

const projects = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
        pubDate: z.coerce.date().optional(), // Projects might just be ordered by importance or date
		tags: z.array(z.string()).optional(),
		image: z.string().optional(),
        repoUrl: z.string().url().optional(),
        demoUrl: z.string().url().optional(),
	}),
});

export const collections = { blog, projects };
