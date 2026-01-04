import { ParsedMdxDoc, TraitFunctionDoc } from './MdxParser';

export type ApiItemType =
  | 'struct'
  | 'trait'
  | 'enum'
  | 'fn'
  | 'impl'
  | 'extern';

export interface ApiIndexEntry {
  id: string;
  modulePath: string;
  itemName: string;
  itemType: ApiItemType;
  doc: string;
  signature: string;
  url: string;
  traitFunctions?: TraitFunctionDoc[];
}

export interface TemplateBlock {
  name: string;
  typeParam: string;
  types: string[];
  lines: string[];
  consumedIds: Set<string>;
}

interface ModuleBlock {
  modulePath: string;
  doc: string;
  url: string;
  entries: ApiIndexEntry[];
}

const UNSIGNED_TYPES = ['u8', 'u16', 'u32', 'u64', 'u128', 'u256'];
const SIGNED_TYPES = ['i8', 'i16', 'i32', 'i64', 'i128'];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function inferTitleFromFileName(fileName: string): string {
  const baseName = fileName.split('/').pop() ?? fileName;
  const stem = baseName.replace(/\.mdx$/i, '');
  return stem.split('-').join('::');
}

function inferItemType(signature: string): ApiItemType {
  const normalized = signature.trim();
  if (!normalized) {
    return 'fn';
  }
  if (/^trait\s+/i.test(normalized)) {
    return 'trait';
  }
  if (/^struct\s+/i.test(normalized)) {
    return 'struct';
  }
  if (/^enum\s+/i.test(normalized)) {
    return 'enum';
  }
  if (/^impl\s+/i.test(normalized)) {
    return 'impl';
  }
  if (/^extern\s+/i.test(normalized) || /extern\s+fn\s+/i.test(normalized)) {
    return 'extern';
  }
  if (/\bfn\s+/i.test(normalized)) {
    return 'fn';
  }
  return 'fn';
}

function isModuleDoc(title: string, fileName: string): boolean {
  const parts = title.split('::').filter(Boolean);
  const baseName = fileName.split('/').pop() ?? fileName;
  const stemParts = baseName.replace(/\.mdx$/i, '').split('-');
  return parts.length === 2 && stemParts.length === 2;
}

function buildEntryId(
  modulePath: string,
  itemName: string,
  itemType: ApiItemType,
  signature: string,
): string {
  return `${modulePath}:${itemType}:${itemName}:${signature}`;
}

function extractTraitName(signature: string, fallback: string): string {
  const match = signature.match(/^trait\s+([^\s{]+)/i);
  if (match?.[1]) {
    return match[1];
  }
  return fallback;
}

function compactSignature(signature: string): string {
  return normalizeWhitespace(signature.replace(/\n/g, ' '));
}

function formatDoc(doc: string): string {
  if (!doc) return '';
  return doc.replace(/\s+/g, ' ').trim();
}

function compactFunctionSignature(signature: string): {
  signature: string;
  tags: string[];
} {
  const tags: string[] = [];
  let compact = compactSignature(signature);

  if (/\bnopanic\b/i.test(compact)) {
    tags.push('nopanic');
  }

  if (/^extern\s+/i.test(compact) || /\bextern\s+fn\b/i.test(compact)) {
    tags.push('extern');
  }

  compact = compact
    .replace(/^pub\s+/, '')
    .replace(/^extern\s+/, '')
    .replace(/^fn\s+/, '')
    .replace(/^unsafe\s+/, '')
    .replace(/\bextern\s+fn\s+/, '')
    .trim();

  return { signature: compact, tags };
}

function formatTraitLine(entry: ApiIndexEntry): string {
  const traitName = extractTraitName(entry.signature, entry.itemName);
  const functions = (entry.traitFunctions ?? [])
    .map((func) => {
      if (func.signature) {
        const compact = compactSignature(func.signature);
        return compact.startsWith('fn ') ? compact : `fn ${compact}`;
      }
      return `fn ${func.name}()`;
    })
    .filter(Boolean);

  const docSuffix = entry.doc ? ` | ${formatDoc(entry.doc)}` : '';

  if (functions.length === 0) {
    return `${traitName}${docSuffix}`;
  }

  return `${traitName} { ${functions.join('; ')} }${docSuffix}`;
}

function formatStructEnumLine(
  entry: ApiIndexEntry,
  prefix: 'struct' | 'enum',
): string {
  const compact = compactSignature(entry.signature);
  let base: string;
  if (compact.toLowerCase().startsWith(prefix)) {
    base = compact.slice(prefix.length).trim();
  } else {
    base = compact || entry.itemName;
  }
  const docSuffix = entry.doc ? ` | ${formatDoc(entry.doc)}` : '';
  return `${base}${docSuffix}`;
}

function formatImplLine(entry: ApiIndexEntry): string {
  const compact = compactSignature(entry.signature);
  const base = compact || `impl ${entry.itemName}`;
  const docSuffix = entry.doc ? ` | ${formatDoc(entry.doc)}` : '';
  return `${base}${docSuffix}`;
}

function formatFunctionLine(entry: ApiIndexEntry): string {
  if (!entry.signature) {
    const docSuffix = entry.doc ? ` | ${formatDoc(entry.doc)}` : '';
    return `${entry.itemName}${docSuffix}`;
  }
  const { signature, tags } = compactFunctionSignature(entry.signature);
  if (entry.itemType === 'extern' && !tags.includes('extern')) {
    tags.push('extern');
  }
  const tagSuffix = tags.length > 0 ? ` [${tags.join(',')}]` : '';
  const docSuffix = entry.doc ? ` | ${formatDoc(entry.doc)}` : '';
  return `${signature}${tagSuffix}${docSuffix}`;
}

function buildModuleBlocks(docs: ParsedMdxDoc[]): ModuleBlock[] {
  const modules = new Map<string, ModuleBlock>();

  for (const doc of docs) {
    const title = doc.title || inferTitleFromFileName(doc.fileName);
    const moduleDoc = isModuleDoc(title, doc.fileName);

    if (moduleDoc) {
      const modulePath = title;
      const existing = modules.get(modulePath);
      const block: ModuleBlock = existing ?? {
        modulePath,
        doc: '',
        url: doc.sourceUrl,
        entries: [],
      };
      block.doc = doc.description || block.doc;
      block.url = doc.sourceUrl || block.url;
      modules.set(modulePath, block);
      continue;
    }

    const parts = title.split('::').filter(Boolean);
    const modulePath = parts.slice(0, -1).join('::') || title;
    const itemName = parts[parts.length - 1] ?? title;
    const itemType = inferItemType(doc.signature);
    const signature = doc.signature || '';
    const entry: ApiIndexEntry = {
      id: buildEntryId(modulePath, itemName, itemType, signature),
      modulePath,
      itemName,
      itemType,
      doc: doc.description,
      signature,
      url: doc.sourceUrl,
      traitFunctions: doc.traitFunctions,
    };

    const existing = modules.get(modulePath);
    if (!existing) {
      modules.set(modulePath, {
        modulePath,
        doc: '',
        url: '',
        entries: [entry],
      });
    } else {
      existing.entries.push(entry);
    }
  }

  return [...modules.values()].sort((a, b) =>
    a.modulePath.localeCompare(b.modulePath),
  );
}

function detectTemplatesForEntries(entries: ApiIndexEntry[]): TemplateBlock[] {
  const candidateEntries = entries.filter(
    (entry) => entry.itemType === 'fn' || entry.itemType === 'extern',
  );
  const groups = new Map<
    string,
    { types: Set<string>; entries: ApiIndexEntry[] }
  >();

  for (const entry of candidateEntries) {
    const match = entry.itemName.match(
      new RegExp(`^(${UNSIGNED_TYPES.concat(SIGNED_TYPES).join('|')})_(.+)$`),
    );
    if (!match) {
      continue;
    }
    const typeName = match[1];
    const suffix = match[2];
    if (!suffix) {
      continue;
    }
    const key = suffix;
    const group = groups.get(key) ?? { types: new Set<string>(), entries: [] };
    group.types.add(typeName);
    group.entries.push(entry);
    groups.set(key, group);
  }

  const templatesByTypeSet = new Map<string, TemplateBlock>();
  const consumedIds = new Set<string>();
  const typeOrder = [...UNSIGNED_TYPES, ...SIGNED_TYPES];

  for (const [suffix, group] of groups.entries()) {
    const types = [...group.types].sort((a, b) => {
      const aIndex = typeOrder.indexOf(a);
      const bIndex = typeOrder.indexOf(b);
      if (aIndex === -1 || bIndex === -1) {
        return a.localeCompare(b);
      }
      return aIndex - bIndex;
    });
    if (types.length < 3) {
      continue;
    }

    const representative = group.entries[0];
    if (!representative) {
      continue;
    }

    const typeRegex = new RegExp(`\\b(${types.join('|')})\\b`, 'g');
    const typePrefixRegex = new RegExp(`\\b(${types.join('|')})_`, 'g');
    const nameTemplate = representative.itemName.replace(typePrefixRegex, 'T_');
    const signatureTemplate = representative.signature
      ? representative.signature.replace(typeRegex, 'T')
      : '';
    const { signature } = compactFunctionSignature(signatureTemplate);
    const templatedSignature = signature
      ? signature.replace(typePrefixRegex, 'T_')
      : '';
    const line = templatedSignature || nameTemplate;

    const typeSetKey = types.join('|');
    const template = templatesByTypeSet.get(typeSetKey) ?? {
      name: types.every((value) => UNSIGNED_TYPES.includes(value))
        ? 'unsigned_int'
        : types.every((value) => SIGNED_TYPES.includes(value))
          ? 'signed_int'
          : `template_${templatesByTypeSet.size + 1}`,
      typeParam: 'T',
      types,
      lines: [],
      consumedIds: new Set<string>(),
    };

    if (!template.lines.includes(line)) {
      template.lines.push(line);
    }
    group.entries.forEach((entry) => {
      template.consumedIds.add(entry.id);
      consumedIds.add(entry.id);
    });
    templatesByTypeSet.set(typeSetKey, template);
  }

  return [...templatesByTypeSet.values()];
}

export function detectTemplatePatterns(
  entries: ApiIndexEntry[],
): TemplateBlock[] {
  return detectTemplatesForEntries(entries);
}

export function formatAsApiIndex(docs: ParsedMdxDoc[]): string {
  const moduleBlocks = buildModuleBlocks(docs);
  const outputBlocks: string[] = [];

  for (const moduleBlock of moduleBlocks) {
    const lines: string[] = [];
    const docLine = moduleBlock.doc || 'No module summary available.';
    const urlLine =
      moduleBlock.url ||
      `https://docs.starknet.io/build/corelib/${moduleBlock.modulePath.replace(/::/g, '-')}`;

    lines.push(`[module] ${moduleBlock.modulePath}`);
    lines.push(`[doc] ${docLine}`);
    if (urlLine) {
      lines.push(`[url] ${urlLine}`);
    }

    const templates = detectTemplatesForEntries(moduleBlock.entries);
    const filteredEntries = moduleBlock.entries.filter(
      (entry) =>
        !templates.some((template) => template.consumedIds.has(entry.id)),
    );

    const functions = filteredEntries.filter(
      (entry) => entry.itemType === 'fn' || entry.itemType === 'extern',
    );
    const traits = filteredEntries.filter(
      (entry) => entry.itemType === 'trait',
    );
    const structs = filteredEntries.filter(
      (entry) => entry.itemType === 'struct',
    );
    const enums = filteredEntries.filter((entry) => entry.itemType === 'enum');
    const impls = filteredEntries.filter((entry) => entry.itemType === 'impl');

    functions.sort((a, b) => a.itemName.localeCompare(b.itemName));
    traits.sort((a, b) => a.itemName.localeCompare(b.itemName));
    structs.sort((a, b) => a.itemName.localeCompare(b.itemName));
    enums.sort((a, b) => a.itemName.localeCompare(b.itemName));
    impls.sort((a, b) => a.itemName.localeCompare(b.itemName));

    if (functions.length > 0) {
      lines.push('');
      lines.push('[functions]');
      for (const entry of functions) {
        lines.push(`- ${formatFunctionLine(entry)}`);
      }
    }

    if (traits.length > 0) {
      lines.push('');
      lines.push('[traits]');
      for (const entry of traits) {
        lines.push(`- ${formatTraitLine(entry)}`);
      }
    }

    if (structs.length > 0) {
      lines.push('');
      lines.push('[structs]');
      for (const entry of structs) {
        lines.push(`- ${formatStructEnumLine(entry, 'struct')}`);
      }
    }

    if (enums.length > 0) {
      lines.push('');
      lines.push('[enums]');
      for (const entry of enums) {
        lines.push(`- ${formatStructEnumLine(entry, 'enum')}`);
      }
    }

    if (impls.length > 0) {
      lines.push('');
      lines.push('[impls]');
      for (const entry of impls) {
        lines.push(`- ${formatImplLine(entry)}`);
      }
    }

    if (templates.length > 0) {
      for (const template of templates) {
        lines.push('');
        lines.push(
          `[template:${template.name}] ${template.typeParam} in {${template.types.join(',')}}`,
        );
        lines.push('[functions]');
        for (const line of template.lines.sort()) {
          lines.push(`- ${line}`);
        }
      }
    }

    outputBlocks.push(lines.join('\n'));
  }

  return outputBlocks.join('\n\n');
}
