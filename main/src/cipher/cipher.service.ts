import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

export interface EncryptedPayload {
  /** Hex-encoded initialization vector */
  iv: string;
  /** Hex-encoded ciphertext */
  data: string;
  /** Hex-encoded authentication tag */
  tag: string;
}

@Injectable()
export class CipherService {
  private readonly logger = new Logger(CipherService.name);
  private readonly key: Buffer | null = null;
  private readonly _enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const raw = this.configService.get<string>('ENCRYPTION_KEY', '');
    if (raw.length >= 32) {
      // Use a SHA-256 hash of the provided key to get exactly 32 bytes
      this.key = crypto.createHash('sha256').update(raw).digest();
      this._enabled = true;
      this.logger.log('Field-level encryption enabled (AES-256-GCM)');
    } else {
      this._enabled = false;
      this.logger.warn(
        'Field-level encryption DISABLED. Set ENCRYPTION_KEY (min 32 chars) to enable.',
      );
    }
  }

  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * Encrypt a plaintext string.
   * Returns null when encryption is disabled or input is empty.
   */
  encrypt(plaintext: string | null | undefined): EncryptedPayload | null {
    if (!this._enabled || !this.key || !plaintext) return null;

    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, { authTagLength: TAG_LENGTH });

      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);

      const tag = cipher.getAuthTag();

      return {
        iv: iv.toString('hex'),
        data: encrypted.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (err) {
      this.logger.error(`Encryption failed: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Decrypt an EncryptedPayload back to plaintext.
   * Returns null on failure (wrong key, tampered data, etc.).
   */
  decrypt(payload: EncryptedPayload | null | undefined): string | null {
    if (!this._enabled || !this.key || !payload) return null;

    try {
      const iv = Buffer.from(payload.iv, 'hex');
      const encrypted = Buffer.from(payload.data, 'hex');
      const tag = Buffer.from(payload.tag, 'hex');

      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, {
        authTagLength: TAG_LENGTH,
      });
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      return decrypted.toString('utf-8');
    } catch (err) {
      this.logger.error(`Decryption failed: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Encrypt and return a JSON-safe object.
   * Convenience wrapper for storing encrypted fields in the database.
   */
  encryptToJson(plaintext: string | null | undefined): Record<string, string> | null {
    const result = this.encrypt(plaintext);
    if (!result) return null;
    return { iv: result.iv, data: result.data, tag: result.tag };
  }

  /**
   * Decrypt a JSON-safe object back to plaintext.
   */
  decryptFromJson(payload: Record<string, string> | null | undefined): string | null {
    if (!payload?.iv || !payload.data || !payload.tag) return null;
    return this.decrypt({ iv: payload.iv, data: payload.data, tag: payload.tag });
  }

  /**
   * Encrypt and return a JSON string safe for storing in a VARCHAR column.
   * Returns null when encryption is disabled or input is empty.
   */
  encryptToString(plaintext: string | null | undefined): string | null {
    const result = this.encrypt(plaintext);
    if (!result) return null;
    return JSON.stringify(result);
  }

  /**
   * Decrypt a string previously produced by encryptToString().
   * Returns null if the string is not an encrypted payload or decryption fails.
   */
  decryptFromString(encrypted: string | null | undefined): string | null {
    if (!encrypted) return null;
    try {
      const parsed = JSON.parse(encrypted) as EncryptedPayload;
      if (!parsed.iv || !parsed.data || !parsed.tag) return null;
      return this.decrypt(parsed);
    } catch {
      // Not a valid encrypted payload — return as-is (plaintext passthrough)
      return encrypted;
    }
  }
}
