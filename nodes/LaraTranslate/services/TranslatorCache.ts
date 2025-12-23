import { ICredentialDataDecryptedObject } from 'n8n-workflow';
import { Credentials, Translator } from '@translated/lara';
import { LaraCredentials } from '../types/types';
import { LARA_CONFIG } from '../config/config';

/**
 * Manages Translator instances with LRU caching
 * Implements Least Recently Used eviction policy
 */
export class TranslatorCache {
	private cache: Map<string, Translator> = new Map();
	private readonly maxSize: number;

	constructor(maxSize: number = LARA_CONFIG.MAX_CACHE_SIZE) {
		this.maxSize = maxSize;
	}

	/**
	 * Retrieves or creates a Translator instance
	 * @param credentials - Decrypted credentials
	 * @returns Cached or newly created Translator instance
	 */
	getOrCreate(credentials: ICredentialDataDecryptedObject): Translator {
		const { accessKeyId, accessKeySecret } = credentials;
		if (!accessKeyId || !accessKeySecret) {
			throw new Error('Missing credentials: accessKeyId or accessKeySecret');
		}

		const cacheKey = `${accessKeyId}:${accessKeySecret}`;
		const cached = this.cache.get(cacheKey);

		if (cached) {
			// Move to end (LRU)
			this.cache.delete(cacheKey);
			this.cache.set(cacheKey, cached);
			return cached;
		}

		const translator = this.createTranslator(credentials);

		// Evict oldest entry if cache is full
		if (this.cache.size >= this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			this.cache.delete(firstKey as string);
		}

		this.cache.set(cacheKey, translator);
		return translator;
	}

	/**
	 * Creates a new Translator instance
	 * @param credentials - Decrypted credentials
	 * @returns New Translator instance
	 */
	private createTranslator(credentials: ICredentialDataDecryptedObject): Translator {
		const { accessKeyId, accessKeySecret } = credentials;

		const LARA_ACCESS_KEY_ID = accessKeyId as LaraCredentials['LARA_ACCESS_KEY_ID'];
		const LARA_ACCESS_KEY_SECRET = accessKeySecret as LaraCredentials['LARA_ACCESS_KEY_SECRET'];

		const laraCredentials = new Credentials(LARA_ACCESS_KEY_ID, LARA_ACCESS_KEY_SECRET);
		return new Translator(laraCredentials);
	}

	/**
	 * Clears all cached translators
	 */
	clear(): void {
		this.cache.clear();
	}
}
