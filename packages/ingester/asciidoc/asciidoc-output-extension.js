const fs = require('fs');
const path = require('path');
const downdoc = require('downdoc');

module.exports.register = function () {
  this.on('contentClassified', ({ contentCatalog }) => {
    contentCatalog.getPages().forEach((page) => {
      const outputPath = path.join('antora-output', page.src.path);

      const asciidoc = page.contents.toString('utf8');
      // Generate the Markdown file path
      // 1. Remove the .adoc extension and replace it with .md
      // 2. Remove the /modules/ prefix to move all files up a level
      // 3. Remove the /pages/ prefix so that the file is at the root of the sub-path
      // 4. for files in `ROOT`, remove the `ROOT` prefix so that the file is at the root of the repo

      const asciidocPath = outputPath
        .replace(/\/pages\//, '/')
        .replace(/\/modules\//, '/')
        .replace(/\/ROOT\//, '/');

      // Create the output directory
      fs.mkdirSync(path.dirname(asciidocPath), { recursive: true });

      // Write the AsciiDoc content
      fs.writeFileSync(asciidocPath, asciidoc, 'utf8');

      page.out = {
        path: outputPath,
        contents: page.contents,
      };
    });
  });
};
