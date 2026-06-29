/**
 * UUID Generator Logic - Tools Module
 * Handles UUID generation, validation, conversion, and bulk operations
 */

export interface UUIDGeneratorState {
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  success: boolean;
  generatedUUIDs: GeneratedUUID[];
  history: UUIDHistory[];
  favorites: string[];
  settings: UUIDSettings;
}

export interface GeneratedUUID {
  id: string;
  value: string;
  version: 1 | 3 | 4 | 5 | 6 | 7;
  variant: string;
  format: UUIDFormat;
  timestamp: string;
  metadata: UUIDMetadata;
  isValid: boolean;
  components?: UUIDComponents;
}

export interface UUIDComponents {
  timeLow: string;
  timeMid: string;
  timeHiAndVersion: string;
  clockSeqHiAndReserved: string;
  clockSeqLow: string;
  node: string;
}

export interface UUIDMetadata {
  generationMethod: 'random' | 'time-based' | 'name-based' | 'custom';
  namespace?: string;
  name?: string;
  node?: string;
  clockSequence?: number;
  entropy?: number;
  collisionProbability?: string;
}

export type UUIDFormat =
  | 'standard'
  | 'no-hyphens'
  | 'uppercase'
  | 'braces'
  | 'parentheses'
  | 'urn'
  | 'base64'
  | 'hex'
  | 'binary';

export interface UUIDHistory {
  id: string;
  timestamp: string;
  operation: 'generate' | 'validate' | 'convert' | 'analyze';
  input?: string;
  output: string | string[];
  count: number;
  version?: number;
  format?: UUIDFormat;
  success: boolean;
  error?: string;
}

export interface UUIDSettings {
  defaultVersion: 1 | 3 | 4 | 5 | 6 | 7;
  defaultFormat: UUIDFormat;
  defaultCount: number;
  maxBulkGeneration: number;
  autoValidate: boolean;
  showMetadata: boolean;
  includeTimestamp: boolean;
  customNamespace?: string;
  customNode?: string;
  exportFormat: 'json' | 'csv' | 'txt';
  historyLimit: number;
}

export interface UUIDValidationResult {
  isValid: boolean;
  version?: number;
  variant?: string;
  format: UUIDFormat;
  components?: UUIDComponents;
  metadata?: UUIDMetadata;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface UUIDConversionOptions {
  sourceFormat: UUIDFormat;
  targetFormat: UUIDFormat;
  preserveCase?: boolean;
  addPrefix?: string;
  addSuffix?: string;
}

export interface UUIDAnalysis {
  uuid: string;
  version: number;
  variant: string;
  format: UUIDFormat;
  isValid: boolean;
  structure: UUIDStructure;
  timing?: TimingInfo;
  security: SecurityAnalysis;
  entropy: EntropyAnalysis;
  recommendations: string[];
}

export interface UUIDStructure {
  components: UUIDComponents;
  bitLayout: BitLayout;
  fieldSizes: FieldSizes;
  encoding: string;
}

export interface BitLayout {
  version: string;
  variant: string;
  timestamp?: string;
  clockSequence?: string;
  node?: string;
  random?: string;
}

export interface FieldSizes {
  timeLow: number;
  timeMid: number;
  timeHi: number;
  clockSeq: number;
  node: number;
}

export interface TimingInfo {
  timestamp?: Date;
  gregorianEpoch?: Date;
  resolution?: string;
  accuracy?: string;
  clockSequence?: number;
}

export interface SecurityAnalysis {
  predictability: 'low' | 'medium' | 'high';
  entropyBits: number;
  collisionResistance: 'excellent' | 'good' | 'fair' | 'poor';
  informationLeakage: string[];
  recommendations: string[];
}

export interface EntropyAnalysis {
  totalBits: number;
  effectiveBits: number;
  randomnessSources: string[];
  qualityScore: number; // 0-100
  distribution: string;
  patterns: string[];
}

export interface BulkGenerationOptions {
  count: number;
  version: 1 | 3 | 4 | 5 | 6 | 7;
  format: UUIDFormat;
  namespace?: string;
  namePrefix?: string;
  sequential?: boolean;
  customNode?: string;
}

export interface UUIDNamespace {
  name: string;
  uuid: string;
  description: string;
  standard: boolean;
}

export const STANDARD_NAMESPACES: UUIDNamespace[] = [
  {
    name: 'DNS',
    uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    description: 'Domain Name System namespace',
    standard: true,
  },
  {
    name: 'URL',
    uuid: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    description: 'Uniform Resource Locator namespace',
    standard: true,
  },
  {
    name: 'OID',
    uuid: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    description: 'Object Identifier namespace',
    standard: true,
  },
  {
    name: 'X500',
    uuid: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
    description: 'X.500 Distinguished Name namespace',
    standard: true,
  },
];

export class UUIDGeneratorLogic {
  private state: UUIDGeneratorState;
  private crypto: Crypto;

  constructor() {
    this.state = {
      isLoading: false,
      isGenerating: false,
      error: null,
      success: false,
      generatedUUIDs: [],
      history: [],
      favorites: [],
      settings: {
        defaultVersion: 4,
        defaultFormat: 'standard',
        defaultCount: 1,
        maxBulkGeneration: 1000,
        autoValidate: true,
        showMetadata: true,
        includeTimestamp: true,
        exportFormat: 'json',
        historyLimit: 500,
      },
    };

    // Use Web Crypto API if available, fallback to Math.random
    this.crypto =
      (typeof window !== 'undefined' && window.crypto) ||
      (typeof global !== 'undefined' && global.crypto) ||
      ({
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        },
      } as Crypto);
  }

  /**
   * Initialize UUID Generator
   */
  async initialize(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;

    try {
      const [history, favorites, settings] = await Promise.all([
        this.loadHistory(),
        this.loadFavorites(),
        this.loadSettings(),
      ]);

      this.state.history = history;
      this.state.favorites = favorites;

      if (settings) {
        this.state.settings = { ...this.state.settings, ...settings };
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to initialize UUID Generator';
      this.state.error = message;
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Generate single UUID
   */
  generateUUID(
    version?: 1 | 3 | 4 | 5 | 6 | 7,
    format?: UUIDFormat,
    options?: {
      namespace?: string;
      name?: string;
      node?: string;
    }
  ): GeneratedUUID {
    this.state.isGenerating = true;
    this.state.error = null;

    try {
      const uuidVersion = version || this.state.settings.defaultVersion;
      const uuidFormat = format || this.state.settings.defaultFormat;

      let uuid: string;
      let metadata: UUIDMetadata;
      let components: UUIDComponents | undefined;

      switch (uuidVersion) {
        case 1:
          ({ uuid, metadata, components } = this.generateV1UUID(options?.node));
          break;
        case 3:
          ({ uuid, metadata } = this.generateV3UUID(
            options?.namespace,
            options?.name
          ));
          break;
        case 4:
          ({ uuid, metadata } = this.generateV4UUID());
          break;
        case 5:
          ({ uuid, metadata } = this.generateV5UUID(
            options?.namespace,
            options?.name
          ));
          break;
        case 6:
          ({ uuid, metadata, components } = this.generateV6UUID(options?.node));
          break;
        case 7:
          ({ uuid, metadata } = this.generateV7UUID());
          break;
        default:
          throw new Error(`Unsupported UUID version: ${uuidVersion}`);
      }

      const formattedUUID = this.formatUUID(uuid, uuidFormat);

      const generatedUUID: GeneratedUUID = {
        id: `uuid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        value: formattedUUID,
        version: uuidVersion,
        variant: this.getVariant(uuid),
        format: uuidFormat,
        timestamp: new Date().toISOString(),
        metadata,
        isValid: true,
        components,
      };

      this.state.generatedUUIDs.unshift(generatedUUID);

      // Limit stored UUIDs
      if (this.state.generatedUUIDs.length > 100) {
        this.state.generatedUUIDs = this.state.generatedUUIDs.slice(0, 100);
      }

      this.addToHistory({
        id: `history_${Date.now()}`,
        timestamp: new Date().toISOString(),
        operation: 'generate',
        output: formattedUUID,
        count: 1,
        version: uuidVersion,
        format: uuidFormat,
        success: true,
      });

      this.state.success = true;

      this.trackUUIDEvent('uuid_generated', {
        version: uuidVersion,
        format: uuidFormat,
        method: metadata.generationMethod,
      });

      return generatedUUID;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate UUID';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isGenerating = false;
    }
  }

  /**
   * Generate multiple UUIDs
   */
  generateBulkUUIDs(options: BulkGenerationOptions): GeneratedUUID[] {
    if (options.count > this.state.settings.maxBulkGeneration) {
      throw new Error(
        `Cannot generate more than ${this.state.settings.maxBulkGeneration} UUIDs at once`
      );
    }

    this.state.isGenerating = true;
    this.state.error = null;

    try {
      const uuids: GeneratedUUID[] = [];

      for (let i = 0; i < options.count; i++) {
        const name = options.namePrefix
          ? `${options.namePrefix}_${i + 1}`
          : undefined;

        const generatedUUID = this.generateUUID(
          options.version,
          options.format,
          {
            namespace: options.namespace,
            name,
            node: options.customNode,
          }
        );

        uuids.push(generatedUUID);

        // Add small delay for very large batches to avoid blocking
        if (options.count > 100 && i % 100 === 0) {
          // This would be async in a real implementation
        }
      }

      this.addToHistory({
        id: `history_${Date.now()}`,
        timestamp: new Date().toISOString(),
        operation: 'generate',
        output: uuids.map((u) => u.value),
        count: options.count,
        version: options.version,
        format: options.format,
        success: true,
      });

      this.trackUUIDEvent('bulk_uuid_generated', {
        count: options.count,
        version: options.version,
        format: options.format,
      });

      return uuids;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate bulk UUIDs';
      this.state.error = message;
      throw new Error(message);
    } finally {
      this.state.isGenerating = false;
    }
  }

  /**
   * Validate UUID
   */
  validateUUID(uuid: string): UUIDValidationResult {
    const result: UUIDValidationResult = {
      isValid: false,
      format: this.detectFormat(uuid),
      errors: [],
      warnings: [],
      suggestions: [],
    };

    try {
      // Normalize UUID to standard format for validation
      const normalizedUUID = this.normalizeUUID(uuid);

      // Basic format validation
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!uuidRegex.test(normalizedUUID)) {
        result.errors.push('Invalid UUID format');
        return result;
      }

      result.isValid = true;
      result.version = parseInt(normalizedUUID.charAt(14));
      result.variant = this.getVariant(normalizedUUID);

      // Parse components
      result.components = this.parseComponents(normalizedUUID);

      // Version-specific validation
      switch (result.version) {
        case 1:
        case 6:
          result.metadata = this.analyzeTimeBased(normalizedUUID);
          break;
        case 3:
        case 5:
          result.warnings.push(
            'Name-based UUID - ensure proper namespace usage'
          );
          break;
        case 4:
          result.metadata = this.analyzeRandom(normalizedUUID);
          break;
        case 7:
          result.metadata = this.analyzeTimestampBased(normalizedUUID);
          break;
        default:
          result.warnings.push(`Unusual UUID version: ${result.version}`);
      }

      this.addToHistory({
        id: `history_${Date.now()}`,
        timestamp: new Date().toISOString(),
        operation: 'validate',
        input: uuid,
        output: `Valid v${result.version} UUID`,
        count: 1,
        success: result.isValid,
      });

      this.trackUUIDEvent('uuid_validated', {
        isValid: result.isValid,
        version: result.version,
        format: result.format,
      });
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : 'Validation error'
      );
      this.state.error = 'UUID validation failed';
    }

    return result;
  }

  /**
   * Convert UUID format
   */
  convertUUID(uuid: string, options: UUIDConversionOptions): string {
    try {
      const validation = this.validateUUID(uuid);

      if (!validation.isValid) {
        throw new Error('Cannot convert invalid UUID');
      }

      let converted = this.formatUUID(
        this.normalizeUUID(uuid),
        options.targetFormat
      );

      if (options.addPrefix) {
        converted = options.addPrefix + converted;
      }

      if (options.addSuffix) {
        converted = converted + options.addSuffix;
      }

      this.addToHistory({
        id: `history_${Date.now()}`,
        timestamp: new Date().toISOString(),
        operation: 'convert',
        input: uuid,
        output: converted,
        count: 1,
        success: true,
      });

      this.trackUUIDEvent('uuid_converted', {
        sourceFormat: options.sourceFormat,
        targetFormat: options.targetFormat,
      });

      return converted;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'UUID conversion failed';
      this.state.error = message;
      throw new Error(message);
    }
  }

  /**
   * Analyze UUID in detail
   */
  analyzeUUID(uuid: string): UUIDAnalysis {
    const validation = this.validateUUID(uuid);

    if (!validation.isValid) {
      throw new Error('Cannot analyze invalid UUID');
    }

    const normalizedUUID = this.normalizeUUID(uuid);
    const components = this.parseComponents(normalizedUUID);

    const analysis: UUIDAnalysis = {
      uuid: normalizedUUID,
      version: validation.version!,
      variant: validation.variant!,
      format: validation.format,
      isValid: true,
      structure: {
        components,
        bitLayout: this.getBitLayout(normalizedUUID, validation.version!),
        fieldSizes: this.getFieldSizes(),
        encoding: 'hexadecimal',
      },
      security: this.analyzeUUIDSecurity(normalizedUUID, validation.version!),
      entropy: this.analyzeEntropy(normalizedUUID, validation.version!),
      recommendations: [],
    };

    // Add timing info for time-based UUIDs
    if (validation.version === 1 || validation.version === 6) {
      analysis.timing = this.extractTimingInfo(normalizedUUID);
    }

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    this.trackUUIDEvent('uuid_analyzed', {
      version: analysis.version,
      securityScore: analysis.security.entropyBits,
      entropyScore: analysis.entropy.qualityScore,
    });

    return analysis;
  }

  /**
   * Add UUID to favorites
   */
  addToFavorites(uuid: string): void {
    const normalizedUUID = this.normalizeUUID(uuid);

    if (!this.state.favorites.includes(normalizedUUID)) {
      this.state.favorites.push(normalizedUUID);
      this.saveFavorites();

      this.trackUUIDEvent('uuid_favorited', { uuid: normalizedUUID });
    }
  }

  /**
   * Remove UUID from favorites
   */
  removeFromFavorites(uuid: string): void {
    const normalizedUUID = this.normalizeUUID(uuid);
    const index = this.state.favorites.indexOf(normalizedUUID);

    if (index >= 0) {
      this.state.favorites.splice(index, 1);
      this.saveFavorites();

      this.trackUUIDEvent('uuid_unfavorited', { uuid: normalizedUUID });
    }
  }

  /**
   * Export UUIDs
   */
  async exportUUIDs(
    uuids: string[],
    format: 'json' | 'csv' | 'txt'
  ): Promise<void> {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(uuids, null, 2);
          filename = `uuids-${Date.now()}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          content = 'UUID\n' + uuids.join('\n');
          filename = `uuids-${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
        case 'txt':
          content = uuids.join('\n');
          filename = `uuids-${Date.now()}.txt`;
          mimeType = 'text/plain';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      this.trackUUIDEvent('uuids_exported', {
        format,
        count: uuids.length,
      });
    } catch (error) {
      console.error('Export failed:', error);
      this.state.error = 'Failed to export UUIDs';
    }
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<UUIDSettings>): void {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.saveSettings();

    this.trackUUIDEvent('settings_updated', {
      changes: Object.keys(newSettings),
    });
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.state.history = [];
    this.saveHistory();
    this.trackUUIDEvent('history_cleared');
  }

  /**
   * Private UUID generation methods
   */
  private generateV1UUID(customNode?: string): {
    uuid: string;
    metadata: UUIDMetadata;
    components: UUIDComponents;
  } {
    // Generate timestamp (100-nanosecond intervals since October 15, 1582)
    const now = Date.now();
    const timestamp = (now + 12219292800000) * 10000; // Convert to UUID epoch

    const timeLow = (timestamp & 0xffffffff).toString(16).padStart(8, '0');
    const timeMid = ((timestamp >> 32) & 0xffff).toString(16).padStart(4, '0');
    const timeHi = (((timestamp >> 48) & 0x0fff) | 0x1000)
      .toString(16)
      .padStart(4, '0');

    // Clock sequence (14 bits)
    const clockSeq = Math.floor(Math.random() * 0x4000);
    const clockSeqHi = ((clockSeq >> 8) | 0x80).toString(16).padStart(2, '0');
    const clockSeqLow = (clockSeq & 0xff).toString(16).padStart(2, '0');

    // Node (48 bits) - MAC address or random
    let node: string;
    if (customNode) {
      node = customNode
        .replace(/[^0-9a-f]/gi, '')
        .substring(0, 12)
        .padStart(12, '0');
    } else {
      const nodeBytes = new Uint8Array(6);
      this.crypto.getRandomValues(nodeBytes);
      nodeBytes[0] |= 0x01; // Set multicast bit for random node
      node = Array.from(nodeBytes, (byte) =>
        byte.toString(16).padStart(2, '0')
      ).join('');
    }

    const uuid = `${timeLow}-${timeMid}-${timeHi}-${clockSeqHi}${clockSeqLow}-${node}`;

    return {
      uuid,
      metadata: {
        generationMethod: 'time-based',
        clockSequence: clockSeq,
        node: customNode || 'random',
      },
      components: {
        timeLow,
        timeMid,
        timeHiAndVersion: timeHi,
        clockSeqHiAndReserved: clockSeqHi,
        clockSeqLow,
        node,
      },
    };
  }

  private generateV3UUID(
    namespace?: string,
    name?: string
  ): {
    uuid: string;
    metadata: UUIDMetadata;
  } {
    if (!namespace || !name) {
      throw new Error('Namespace and name are required for v3 UUID');
    }

    // This is a simplified implementation - real MD5 would be needed
    const hash = this.simpleHash(namespace + name);

    const uuid = [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '3' + hash.substring(13, 16), // Version 3
      ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) +
        hash.substring(17, 19), // Variant
      hash.substring(20, 32),
    ].join('-');

    return {
      uuid,
      metadata: {
        generationMethod: 'name-based',
        namespace,
        name,
      },
    };
  }

  private generateV4UUID(): { uuid: string; metadata: UUIDMetadata } {
    const bytes = new Uint8Array(16);
    this.crypto.getRandomValues(bytes);

    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

    const hex = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    const uuid = [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20, 32),
    ].join('-');

    return {
      uuid,
      metadata: {
        generationMethod: 'random',
        entropy: 122, // 122 bits of entropy
      },
    };
  }

  private generateV5UUID(
    namespace?: string,
    name?: string
  ): {
    uuid: string;
    metadata: UUIDMetadata;
  } {
    if (!namespace || !name) {
      throw new Error('Namespace and name are required for v5 UUID');
    }

    // This is a simplified implementation - real SHA-1 would be needed
    const hash = this.simpleHash(namespace + name + 'sha1');

    const uuid = [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '5' + hash.substring(13, 16), // Version 5
      ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) +
        hash.substring(17, 19), // Variant
      hash.substring(20, 32),
    ].join('-');

    return {
      uuid,
      metadata: {
        generationMethod: 'name-based',
        namespace,
        name,
      },
    };
  }

  private generateV6UUID(customNode?: string): {
    uuid: string;
    metadata: UUIDMetadata;
    components: UUIDComponents;
  } {
    // V6 is similar to V1 but with reordered timestamp for better sorting
    const v1Result = this.generateV1UUID(customNode);

    // Reorder timestamp fields for better lexicographic sorting
    const components = v1Result.components;
    const timeHi = components.timeHiAndVersion.substring(1); // Remove version digit
    const reorderedUuid = `${timeHi}${
      components.timeMid
    }-${components.timeLow.substring(0, 4)}-6${components.timeLow.substring(
      4
    )}-${components.clockSeqHiAndReserved}${components.clockSeqLow}-${
      components.node
    }`;

    return {
      uuid: reorderedUuid,
      metadata: {
        ...v1Result.metadata,
        generationMethod: 'time-based',
      },
      components: v1Result.components,
    };
  }

  private generateV7UUID(): { uuid: string; metadata: UUIDMetadata } {
    // Unix timestamp in milliseconds (48 bits)
    const timestamp = Date.now();

    // Random bytes (74 bits)
    const randomBytes = new Uint8Array(10);
    this.crypto.getRandomValues(randomBytes);

    // Build the UUID
    const timestampHex = timestamp.toString(16).padStart(12, '0');
    const randomHex = Array.from(randomBytes, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    const uuid = [
      timestampHex.substring(0, 8),
      timestampHex.substring(8, 12),
      '7' + randomHex.substring(0, 3), // Version 7
      ((parseInt(randomHex.substring(3, 4), 16) & 0x3) | 0x8).toString(16) +
        randomHex.substring(4, 7), // Variant
      randomHex.substring(7, 19),
    ].join('-');

    return {
      uuid,
      metadata: {
        generationMethod: 'time-based',
        entropy: 74,
      },
    };
  }

  /**
   * Utility methods
   */
  private formatUUID(uuid: string, format: UUIDFormat): string {
    const normalized = this.normalizeUUID(uuid);

    switch (format) {
      case 'standard':
        return normalized;
      case 'no-hyphens':
        return normalized.replace(/-/g, '');
      case 'uppercase':
        return normalized.toUpperCase();
      case 'braces':
        return `{${normalized}}`;
      case 'parentheses':
        return `(${normalized})`;
      case 'urn':
        return `urn:uuid:${normalized}`;
      case 'base64':
        return this.uuidToBase64(normalized);
      case 'hex':
        return `0x${normalized.replace(/-/g, '')}`;
      case 'binary':
        return this.uuidToBinary(normalized);
      default:
        return normalized;
    }
  }

  private normalizeUUID(uuid: string): string {
    return uuid
      .toLowerCase()
      .replace(/[{}()]/g, '')
      .replace(/^(urn:uuid:|0x)/i, '')
      .replace(/[^0-9a-f-]/g, '');
  }

  private detectFormat(uuid: string): UUIDFormat {
    if (uuid.startsWith('{') && uuid.endsWith('}')) return 'braces';
    if (uuid.startsWith('(') && uuid.endsWith(')')) return 'parentheses';
    if (uuid.toLowerCase().startsWith('urn:uuid:')) return 'urn';
    if (uuid.startsWith('0x')) return 'hex';
    if (uuid.includes('-')) return 'standard';
    if (/^[0-9A-F]+$/i.test(uuid) && uuid.length === 32) return 'no-hyphens';
    return 'standard';
  }

  private parseComponents(uuid: string): UUIDComponents {
    const parts = uuid.split('-');
    return {
      timeLow: parts[0],
      timeMid: parts[1],
      timeHiAndVersion: parts[2],
      clockSeqHiAndReserved: parts[3].substring(0, 2),
      clockSeqLow: parts[3].substring(2, 4),
      node: parts[4],
    };
  }

  private getVariant(uuid: string): string {
    const variantByte = parseInt(uuid.split('-')[3].substring(0, 2), 16);
    if ((variantByte & 0x80) === 0) return 'NCS';
    if ((variantByte & 0xc0) === 0x80) return 'RFC 4122';
    if ((variantByte & 0xe0) === 0xc0) return 'Microsoft';
    return 'Reserved';
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  }

  private uuidToBase64(uuid: string): string {
    const hex = uuid.replace(/-/g, '');
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
  }

  private uuidToBinary(uuid: string): string {
    const hex = uuid.replace(/-/g, '');
    return hex
      .split('')
      .map((char) => parseInt(char, 16).toString(2).padStart(4, '0'))
      .join('');
  }

  private getBitLayout(uuid: string, version: number): BitLayout {
    const components = this.parseComponents(uuid);

    return {
      version: `${version} (bits 12-15 of time_hi_and_version)`,
      variant: 'RFC 4122 (bits 6-7 of clock_seq_hi_and_reserved)',
      timestamp:
        version === 1 || version === 6 ? 'Encoded in time fields' : undefined,
      clockSequence:
        version === 1 || version === 6
          ? '14 bits in clock_seq fields'
          : undefined,
      node:
        version === 1 || version === 6
          ? '48 bits (MAC address or random)'
          : undefined,
      random:
        version === 4
          ? '122 bits of random data'
          : version === 7
          ? '74 bits of random data'
          : undefined,
    };
  }

  private getFieldSizes(): FieldSizes {
    return {
      timeLow: 32,
      timeMid: 16,
      timeHi: 16,
      clockSeq: 16,
      node: 48,
    };
  }

  private analyzeUUIDSecurity(uuid: string, version: number): SecurityAnalysis {
    const analysis: SecurityAnalysis = {
      predictability: 'low',
      entropyBits: 0,
      collisionResistance: 'excellent',
      informationLeakage: [],
      recommendations: [],
    };

    switch (version) {
      case 1:
      case 6:
        analysis.predictability = 'high';
        analysis.entropyBits = 47; // Only clock sequence and random node bits
        analysis.informationLeakage.push('MAC address', 'timestamp');
        analysis.recommendations.push('Consider using v4 for better privacy');
        break;
      case 3:
      case 5:
        analysis.predictability = 'high';
        analysis.entropyBits = 0; // Deterministic
        analysis.collisionResistance = 'good';
        analysis.informationLeakage.push('namespace', 'name');
        break;
      case 4:
        analysis.predictability = 'low';
        analysis.entropyBits = 122;
        analysis.collisionResistance = 'excellent';
        break;
      case 7:
        analysis.predictability = 'medium';
        analysis.entropyBits = 74;
        analysis.informationLeakage.push('timestamp');
        break;
    }

    return analysis;
  }

  private analyzeEntropy(uuid: string, version: number): EntropyAnalysis {
    const hex = uuid.replace(/-/g, '');

    // Simple entropy analysis
    const charCounts = new Map<string, number>();
    for (const char of hex) {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    }

    const uniqueChars = charCounts.size;
    const distribution = (uniqueChars / 16) * 100; // Percentage of unique hex chars used

    return {
      totalBits: 128,
      effectiveBits: version === 4 ? 122 : version === 7 ? 74 : 47,
      randomnessSources:
        version === 4
          ? ['CSPRNG']
          : version === 1
          ? ['timestamp', 'clock sequence', 'MAC/random node']
          : ['hash function'],
      qualityScore: Math.min(
        100,
        distribution * 0.8 + (uniqueChars > 10 ? 20 : 0)
      ),
      distribution: `${uniqueChars}/16 unique characters`,
      patterns: this.detectPatterns(hex),
    };
  }

  private detectPatterns(hex: string): string[] {
    const patterns: string[] = [];

    // Check for repeated sequences
    for (let i = 0; i < hex.length - 3; i++) {
      const sequence = hex.substring(i, i + 4);
      if (hex.indexOf(sequence, i + 1) !== -1) {
        patterns.push(`Repeated sequence: ${sequence}`);
        break;
      }
    }

    // Check for ascending/descending sequences
    let ascending = 0;
    let descending = 0;
    for (let i = 0; i < hex.length - 1; i++) {
      const current = parseInt(hex[i], 16);
      const next = parseInt(hex[i + 1], 16);
      if (next === current + 1) ascending++;
      if (next === current - 1) descending++;
    }

    if (ascending > 3) patterns.push('Contains ascending sequences');
    if (descending > 3) patterns.push('Contains descending sequences');

    return patterns;
  }

  private extractTimingInfo(uuid: string): TimingInfo {
    const components = this.parseComponents(uuid);

    // Extract timestamp from v1 UUID
    const timeLow = parseInt(components.timeLow, 16);
    const timeMid = parseInt(components.timeMid, 16);
    const timeHi = parseInt(components.timeHiAndVersion.substring(1), 16);

    const timestamp = (timeHi << 32) | (timeMid << 16) | timeLow;
    const unixTimestamp = timestamp / 10000 - 12219292800000; // Convert to Unix epoch

    return {
      timestamp: new Date(unixTimestamp),
      gregorianEpoch: new Date('1582-10-15'),
      resolution: '100 nanoseconds',
      accuracy: 'System clock dependent',
      clockSequence:
        parseInt(
          components.clockSeqHiAndReserved + components.clockSeqLow,
          16
        ) & 0x3fff,
    };
  }

  private generateRecommendations(analysis: UUIDAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.version === 1 || analysis.version === 6) {
      recommendations.push('Consider using v4 UUIDs for better privacy');
      recommendations.push('Ensure system clock is properly synchronized');
    }

    if (analysis.security.entropyBits < 100) {
      recommendations.push(
        'Low entropy detected - ensure proper random number generation'
      );
    }

    if (analysis.entropy.patterns.length > 0) {
      recommendations.push(
        'Patterns detected - verify randomness source quality'
      );
    }

    return recommendations;
  }

  /**
   * Storage methods — DB-backed via /api/user/preferences/tool-state
   */
  private async loadHistory(): Promise<UUIDHistory[]> {
    try {
      const res = await fetch('/api/user/preferences/tool-state/uuid_generator', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data?.history || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  private async loadFavorites(): Promise<string[]> {
    try {
      const res = await fetch('/api/user/preferences/tool-state/uuid_generator', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data?.favorites || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  private async loadSettings(): Promise<Partial<UUIDSettings> | null> {
    try {
      const res = await fetch('/api/user/preferences/tool-state/uuid_generator', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        return json.data?.settings || null;
      }
      return null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  private addToHistory(record: UUIDHistory): void {
    this.state.history.unshift(record);

    // Limit history size
    if (this.state.history.length > this.state.settings.historyLimit) {
      this.state.history = this.state.history.slice(
        0,
        this.state.settings.historyLimit
      );
    }

    this.saveHistory();
  }

  private saveHistory(): void {
    try {
      fetch('/api/user/preferences/tool-state/uuid_generator', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ history: this.state.history }),
      }).catch(err => console.error('Error saving history:', err));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }

  private saveFavorites(): void {
    try {
      fetch('/api/user/preferences/tool-state/uuid_generator', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ favorites: this.state.favorites }),
      }).catch(err => console.error('Error saving favorites:', err));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  private saveSettings(): void {
    try {
      fetch('/api/user/preferences/tool-state/uuid_generator', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings: this.state.settings }),
      }).catch(err => console.error('Error saving settings:', err));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  private trackUUIDEvent(
    event: string,
    properties?: Record<string, any>
  ): void {
    try {
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('UUID Generator', {
          event,
          timestamp: new Date().toISOString(),
          ...properties,
        });
      }
    } catch (error) {
      console.error('Error tracking UUID event:', error);
    }
  }

  /**
   * Public getters
   */
  getState(): UUIDGeneratorState {
    return { ...this.state };
  }

  getGeneratedUUIDs(): GeneratedUUID[] {
    return this.state.generatedUUIDs;
  }

  getHistory(): UUIDHistory[] {
    return this.state.history;
  }

  getFavorites(): string[] {
    return this.state.favorites;
  }

  getStandardNamespaces(): UUIDNamespace[] {
    return STANDARD_NAMESPACES;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.state.error = null;
  }
}

// Export singleton instance
export const uuidGeneratorLogic = new UUIDGeneratorLogic();

// Export utility functions
export const uuidGeneratorUtils = {
  /**
   * Get version info
   */
  getVersionInfo(version: number): { name: string; description: string } {
    const versions = {
      1: {
        name: 'Time-based',
        description: 'Based on timestamp and MAC address',
      },
      3: {
        name: 'Name-based (MD5)',
        description: 'Based on namespace and name using MD5',
      },
      4: {
        name: 'Random',
        description: 'Based on random or pseudo-random numbers',
      },
      5: {
        name: 'Name-based (SHA-1)',
        description: 'Based on namespace and name using SHA-1',
      },
      6: {
        name: 'Reordered time',
        description: 'Time-based with better lexicographic sorting',
      },
      7: {
        name: 'Unix timestamp',
        description: 'Based on Unix timestamp with random data',
      },
    };
    return (
      versions[version as keyof typeof versions] || {
        name: 'Unknown',
        description: 'Unknown version',
      }
    );
  },

  /**
   * Format UUID display
   */
  formatUUIDDisplay(uuid: GeneratedUUID): string {
    return `${uuid.value} (v${uuid.version})`;
  },

  /**
   * Get security level color
   */
  getSecurityColor(entropyBits: number): string {
    if (entropyBits >= 100) return '#059669'; // High security - green
    if (entropyBits >= 70) return '#D97706'; // Medium security - amber
    if (entropyBits >= 40) return '#DC2626'; // Low security - red
    return '#991B1B'; // Very low security - dark red
  },

  /**
   * Estimate collision probability
   */
  estimateCollisionProbability(version: number, count: number = 1): string {
    let entropy: number;

    switch (version) {
      case 1:
      case 6:
        entropy = 47;
        break;
      case 4:
        entropy = 122;
        break;
      case 7:
        entropy = 74;
        break;
      default:
        return 'N/A';
    }

    const probability = Math.pow(count, 2) / (2 * Math.pow(2, entropy));

    if (probability < 1e-15) return '< 1 in 10^15';
    if (probability < 1e-12) return '< 1 in 10^12';
    if (probability < 1e-9) return '< 1 in 10^9';

    return `≈ ${probability.toExponential(2)}`;
  },
};
