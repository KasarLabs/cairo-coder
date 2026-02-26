import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type SkillConfig = {
  id: string;
  url: string;
};

type SkillsConfigFile = {
  skills: SkillConfig[];
};

const skillsConfigPath = join(import.meta.dir, '..', 'config', 'skills.json');

describe('skills config', () => {
  it('matches the RFC Step 3 contract', () => {
    const raw = readFileSync(skillsConfigPath, 'utf8');
    const parsed = JSON.parse(raw) as SkillsConfigFile;

    expect(Array.isArray(parsed.skills)).toBe(true);
    expect(parsed.skills).toHaveLength(4);

    const expectedIds = [
      'benchmarking-cairo',
      'cairo-coding',
      'avnu',
      'starknet-defi',
    ];

    expect(parsed.skills.map((skill) => skill.id)).toEqual(expectedIds);

    for (const skill of parsed.skills) {
      expect(typeof skill.id).toBe('string');
      expect(skill.id.length).toBeGreaterThan(0);
      expect(typeof skill.url).toBe('string');

      const url = new URL(skill.url);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('github.com');
    }

    const benchmarkingCairoUrl = parsed.skills.find(
      (skill) => skill.id === 'benchmarking-cairo',
    )?.url;
    expect(benchmarkingCairoUrl).toBeDefined();
    expect(benchmarkingCairoUrl as string).toContain('/tree/');

    const cairoCodingUrl = parsed.skills.find(
      (skill) => skill.id === 'cairo-coding',
    )?.url;
    expect(cairoCodingUrl).toBeDefined();
    expect(cairoCodingUrl as string).toContain('/tree/');

    const starknetDefiUrl = parsed.skills.find(
      (skill) => skill.id === 'starknet-defi',
    )?.url;
    expect(starknetDefiUrl).toBeDefined();
    expect(starknetDefiUrl as string).toMatch(/\/blob\/[0-9a-f]{40}\//);
  });
});
