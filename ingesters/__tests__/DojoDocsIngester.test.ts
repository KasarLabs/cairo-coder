import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { DojoDocsIngester } from '../src/ingesters/DojoDocsIngester';
import * as fs from 'fs/promises';
import { getTempDir } from '../src/utils/paths';

describe('DojoDocsIngester', () => {
  let ingester: DojoDocsIngester;
  const extractDir = getTempDir('dojo-docs');

  beforeAll(() => {
    ingester = new DojoDocsIngester();
  });

  afterAll(async () => {
    // Cleanup test files
    try {
      await fs.rm(extractDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should download and extract Dojo docs', async () => {
    // This will actually download the repo - may take time
    const pages = await (ingester as any).downloadAndExtractDocs();

    console.log('\n=== Download Results ===');
    console.log(`Total pages found: ${pages.length}`);
    console.log('\nPage details (first 5):');
    pages.slice(0, 5).forEach((page: any) => {
      console.log(`  - ${page.name} (${page.content.length} chars)`);
      console.log(`    First 100 chars: ${page.content.substring(0, 100)}...`);
    });

    expect(pages).toBeDefined();
    expect(pages.length).toBeGreaterThan(0);

    // Check that we got Dojo documentation
    expect(pages.some((page: any) => page.content.includes('Dojo'))).toBe(true);
  }, 60000); // 60 second timeout for git clone

  test('should verify extracted directory structure', async () => {
    // Download first
    await (ingester as any).downloadAndExtractDocs();

    // Check directory structure
    const docsDir = `${extractDir}/docs`;
    const stat = await fs.stat(docsDir);

    console.log('\n=== Directory Structure ===');
    console.log(`Docs directory: ${docsDir}`);
    console.log(`Exists: ${stat.isDirectory()}`);

    // List top-level items in the directory
    const files = await fs.readdir(docsDir);
    console.log(`\nTop-level items found: ${files.length}`);
    files.forEach((file) => {
      console.log(`  - ${file}`);
    });

    expect(stat.isDirectory()).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  }, 60000);
});
