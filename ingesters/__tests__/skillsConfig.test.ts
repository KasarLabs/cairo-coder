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
  it('should contain at least one skill with valid structure', () => {
    const raw = readFileSync(skillsConfigPath, 'utf8');
    const parsed = JSON.parse(raw) as SkillsConfigFile;

    expect(Array.isArray(parsed.skills)).toBe(true);
    expect(parsed.skills.length).toBeGreaterThan(0);

    for (const skill of parsed.skills) {
      expect(typeof skill.id).toBe('string');
      expect(skill.id.length).toBeGreaterThan(0);
      expect(typeof skill.url).toBe('string');

      const url = new URL(skill.url);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('github.com');
    }
  });

  it('should have unique skill ids', () => {
    const raw = readFileSync(skillsConfigPath, 'utf8');
    const parsed = JSON.parse(raw) as SkillsConfigFile;

    const ids = parsed.skills.map((skill) => skill.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should use /tree/ or /blob/ GitHub URL formats', () => {
    const raw = readFileSync(skillsConfigPath, 'utf8');
    const parsed = JSON.parse(raw) as SkillsConfigFile;

    for (const skill of parsed.skills) {
      expect(skill.url).toMatch(/\/(tree|blob)\//);
    }
  });
});
