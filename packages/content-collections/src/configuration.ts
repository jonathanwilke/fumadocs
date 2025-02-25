/**
 * Default configuration
 *
 * You may copy and modify the code
 */
import type { Context, Meta } from '@content-collections/core';
import {
  compileMDX as baseCompileMDX,
  type Options as MDXOptions,
} from '@content-collections/mdx';
import {
  rehypeCode,
  remarkGfm,
  remarkHeading,
  remarkStructure,
} from 'fumadocs-core/mdx-plugins';
import type { z as Zod } from 'zod';
import rehypeImgSize from 'rehype-img-size';

export interface TransformOptions extends MDXOptions {
  /**
   * Generate `structuredData`
   *
   * @defaultValue true
   */
  generateStructuredData?: boolean;
}

export type SerializableTOC = {
  title: string;
  url: string;
  depth: number;
}[];

interface BaseDoc {
  _meta: Meta;
  content: string;
}

export async function transformMDX<D extends BaseDoc>(
  document: D,
  context: Context,
  options: TransformOptions = {},
): Promise<
  D & {
    body: string;
    toc: SerializableTOC;
    /**
     * `StructuredData` for search indexes
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Avoid wrong type errors
    structuredData: any;
  }
> {
  const { generateStructuredData = true, ...rest } = options;

  return context.cache(
    {
      type: 'fumadocs',
      document,
    },
    async () => {
      let data: Record<string, unknown> = {};

      const body = await compileMDX(
        document,
        {
          ...context,
          // avoid nested caching
          cache: async (input, fn) => fn(input),
        },
        {
          cwd: process.cwd(),
          ...rest,
          remarkPlugins: [
            ...(rest.remarkPlugins ?? []),
            ...(generateStructuredData ? [remarkStructure] : []),
            () => {
              return (_, file) => {
                data = file.data;
              };
            },
          ],
        },
      );

      return {
        ...document,
        toc: data.toc as SerializableTOC,
        structuredData: data.structuredData,
        body,
      };
    },
  );
}

export async function compileMDX(
  document: BaseDoc,
  context: Context,
  options: MDXOptions = {},
): Promise<string> {
  const { remarkPlugins = [], rehypePlugins = [], ...rest } = options;

  return baseCompileMDX(context, document, {
    ...rest,
    remarkPlugins: [remarkGfm, remarkHeading, ...remarkPlugins],
    rehypePlugins: [
      rehypeCode,
      [rehypeImgSize, { dir: './public' }],
      ...rehypePlugins,
    ],
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- The type is dynamically generated by Zod
export function createDocSchema(z: typeof Zod) {
  return {
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    full: z.boolean().optional(),
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- The type is dynamically generated by Zod
export function createMetaSchema(z: typeof Zod) {
  return {
    title: z.string().optional(),
    pages: z.array(z.string()).optional(),
    icon: z.string().optional(),
    root: z.boolean().optional(),
    defaultOpen: z.boolean().optional(),
  };
}
