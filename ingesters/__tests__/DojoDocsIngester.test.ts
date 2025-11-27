import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { DojoDocsIngester } from '../src/ingesters/DojoDocsIngester';
import * as fs from 'fs/promises';
import { getTempDir } from '../src/utils/paths';

describe('DojoJsDocsIngester', () => {
  let ingester: DojoDocsIngester;
  const extractDir = getTempDir('dojo-js-docs');

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

  test('should download and extract Dojo JS docs', async () => {
    // This will actually download the repo - may take time
    const pages = await (ingester as any).downloadAndExtractDocs();

    console.log('\n=== Download Results ===');
    console.log(`Total pages found: ${pages.length}`);
    console.log('\nPage details:');
    pages.forEach((page: any) => {
      console.log(`  - ${page.name} (${page.content.length} chars)`);
      console.log(`    First 200 chars: ${page.content.substring(0, 200)}...`);
    });

    expect(pages).toBeDefined();
    expect(pages.length).toBeGreaterThan(0);

    // Check that we only got javascript files
    pages.forEach((page: any) => {
      expect(page.name).toContain('javascript');
    });
  }, 60000); // 60 second timeout for git clone

  test('should verify extracted directory structure', async () => {
    // Download first
    await (ingester as any).downloadAndExtractDocs();

    // Check directory structure
    const docsDir = `${extractDir}/docs/pages/client/sdk`;
    const stat = await fs.stat(docsDir);

    console.log('\n=== Directory Structure ===');
    console.log(`Docs directory: ${docsDir}`);
    console.log(`Exists: ${stat.isDirectory()}`);

    // List files in the directory
    const files = await fs.readdir(docsDir);
    console.log(`\nFiles found: ${files.length}`);
    files.forEach(file => {
      console.log(`  - ${file}`);
    });

    expect(stat.isDirectory()).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  }, 60000);
});
