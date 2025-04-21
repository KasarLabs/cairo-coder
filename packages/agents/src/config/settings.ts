//TODO deduplicate this file!

import fs from 'fs';
import path from 'path';
import toml from '@iarna/toml';
import { Config, RecursivePartial, VectorStoreConfig } from '../types';

const configFileName = 'config.toml';

const loadConfig = () => {
  // Find the package root by looking for package.json
  let packageRoot = __dirname;
  while (
    !fs.existsSync(path.join(packageRoot, 'package.json')) &&
    packageRoot !== '/'
  ) {
    packageRoot = path.dirname(packageRoot);
  }

  if (packageRoot === '/') {
    throw new Error('Could not find package.json in any parent directory');
  }

  return toml.parse(
    fs.readFileSync(path.join(packageRoot, configFileName), 'utf-8'),
  ) as any as Config;
};

export const getHostedModeConfig = () => loadConfig().HOSTED_MODE;

export const getPort = () => loadConfig().GENERAL.PORT;

export const getSimilarityMeasure = () =>
  loadConfig().GENERAL.SIMILARITY_MEASURE;

export const getOpenaiApiKey = () => loadConfig().API_KEYS.OPENAI;

export const getGroqApiKey = () => loadConfig().API_KEYS.GROQ;

export const getAnthropicApiKey = () => loadConfig().API_KEYS.ANTHROPIC;

export const getDeepseekApiKey = () => loadConfig().API_KEYS.DEEPSEEK;

export const getGeminiApiKey = () => loadConfig().API_KEYS.GEMINI;

export const getVectorDbConfig = () => {
  const config = loadConfig();

  return {
    POSTGRES_USER: config.VECTOR_DB.POSTGRES_USER || '',
    POSTGRES_PASSWORD: config.VECTOR_DB.POSTGRES_PASSWORD || '',
    POSTGRES_ROOT_DB: config.VECTOR_DB.POSTGRES_ROOT_DB || '',
    POSTGRES_HOST: config.VECTOR_DB.POSTGRES_HOST || '',
    POSTGRES_PORT: config.VECTOR_DB.POSTGRES_PORT || '',
  } as VectorStoreConfig;
};

export const updateConfig = (config: RecursivePartial<Config>) => {
  const currentConfig = loadConfig();

  for (const key in currentConfig) {
    if (!config[key]) config[key] = {};

    if (typeof currentConfig[key] === 'object' && currentConfig[key] !== null) {
      for (const nestedKey in currentConfig[key]) {
        if (
          !config[key][nestedKey] &&
          currentConfig[key][nestedKey] &&
          config[key][nestedKey] !== ''
        ) {
          config[key][nestedKey] = currentConfig[key][nestedKey];
        }
      }
    } else if (currentConfig[key] && config[key] !== '') {
      config[key] = currentConfig[key];
    }
  }

  // Find the package root by looking for package.json
  let packageRoot = __dirname;
  while (
    !fs.existsSync(path.join(packageRoot, 'package.json')) &&
    packageRoot !== '/'
  ) {
    packageRoot = path.dirname(packageRoot);
  }

  if (packageRoot === '/') {
    throw new Error('Could not find package.json in any parent directory');
  }

  fs.writeFileSync(
    path.join(packageRoot, configFileName),
    toml.stringify(config),
  );
};

export const getStarknetFoundryVersion = () =>
  loadConfig().VERSIONS.STARKNET_FOUNDRY;
export const getScarbVersion = () => loadConfig().VERSIONS.SCARB;
