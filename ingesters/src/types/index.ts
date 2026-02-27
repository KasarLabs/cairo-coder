export interface VectorStoreConfig {
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: string;
  POSTGRES_TABLE_NAME: string;
}

export enum DocumentSource {
  CAIRO_BOOK = 'cairo_book',
  STARKNET_DOCS = 'starknet_docs',
  STARKNET_FOUNDRY = 'starknet_foundry',
  CAIRO_BY_EXAMPLE = 'cairo_by_example',
  OPENZEPPELIN_DOCS = 'openzeppelin_docs',
  CORELIB_DOCS = 'corelib_docs',
  SCARB_DOCS = 'scarb_docs',
  STARKNET_JS = 'starknet_js',
  STARKNET_BLOG = 'starknet_blog',
  DOJO_DOCS = 'dojo_docs',
  CAIRO_SKILLS = 'cairo_skills',
}

export type BookChunk = {
  name: string;
  title: string;
  chunkNumber: number;
  contentHash: string;
  uniqueId: string;
  sourceLink: string;
  source: DocumentSource;
  skillId?: string;
  fullContent?: string;
};
