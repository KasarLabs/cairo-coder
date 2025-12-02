import * as fs from 'fs/promises';
import * as path from 'path';
import { type BookConfig, type BookPageDto } from './types';
import { logger } from './logger';

/**
 * Process documentation files from a directory
 *
 * This function recursively processes all files in a directory that match the specified
 * file extension and returns them as BookPageDto objects.
 *
 * @param config - The book configuration
 * @param directory - The directory to process
 * @returns Promise<BookPageDto[]> - Array of BookPageDto objects
 */
export async function processDocFiles(
  config: BookConfig,
  directory: string,
): Promise<BookPageDto[]> {
  try {
    logger.info(`Processing documentation files in ${directory}`);
    const pages: BookPageDto[] = [];

    async function processDirectory(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively process subdirectories
          await processDirectory(fullPath);
        } else if (entry.isFile()) {
          // Check if the file matches any of the configured extensions
          const fileExt = path.extname(entry.name).toLowerCase();
          if (config.fileExtensions.includes(fileExt)) {
            // Process documentation files
            const content = await fs.readFile(fullPath, 'utf8');

            // Skip empty files
            if (content.trim().length === 0) {
              logger.warn(`Skipping empty file: ${fullPath}`);
              continue;
            }

            pages.push({
              name: path.relative(directory, fullPath).replace(fileExt, ''),
              content,
            });
          }
        }
      }
    }

    await processDirectory(directory);
    return pages;
  } catch (err) {
    const errorMessage = (err as Error).message;
    logger.error('Error processing directory:', errorMessage);
    throw new Error(`Failed to process directory: ${errorMessage}`);
  }
}
