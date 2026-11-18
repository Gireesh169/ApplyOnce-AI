import { LearnedFieldMapping } from './types';
import { StorageService } from '@/storage/StorageService';

export class FieldLearningService {
  /**
   * Retrieves all learned field mappings.
   */
  public static async getMappings(): Promise<LearnedFieldMapping[]> {
    return await StorageService.getLearnedMappings();
  }

  /**
   * Records a user-confirmed field mapping into universal field memory.
   * NOTE: Never stores personal field values in the mapping dictionary!
   */
  public static async recordConfirmedMapping(
    fieldSignature: string,
    semanticMeaning: string,
    matchedProfilePath: string,
    domain: string = '*',
    userConfirmed: boolean = true
  ): Promise<LearnedFieldMapping> {
    const cleanSig = fieldSignature.toLowerCase().trim();
    const existing = await StorageService.getLearnedMappings();

    const existingMatch = existing.find(
      m => (m.websiteDomain === domain || m.websiteDomain === '*') &&
           m.fieldSignature === cleanSig
    );

    const now = new Date().toISOString();
    const mapping: LearnedFieldMapping = {
      id: existingMatch ? existingMatch.id : `map_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      websiteDomain: domain,
      fieldSignature: cleanSig,
      semanticMeaning,
      matchedProfilePath,
      userConfirmed,
      confidenceScore: userConfirmed ? 1.0 : 0.85,
      createdAt: existingMatch ? existingMatch.createdAt : now,
      lastUsedAt: now,
      usageCount: existingMatch ? (existingMatch.usageCount + 1) : 1
    };

    await StorageService.saveLearnedMapping(mapping);
    return mapping;
  }

  /**
   * Deletes a specific learned mapping by ID.
   */
  public static async deleteMapping(id: string): Promise<void> {
    await StorageService.deleteLearnedMapping(id);
  }

  /**
   * Resets all learned mappings.
   */
  public static async resetMappings(): Promise<void> {
    await StorageService.resetLearnedMappings();
  }

  /**
   * Updates an existing mapping's target profile path or domain.
   */
  public static async updateMapping(
    id: string,
    updates: Partial<Pick<LearnedFieldMapping, 'semanticMeaning' | 'matchedProfilePath' | 'websiteDomain'>>
  ): Promise<void> {
    const mappings = await StorageService.getLearnedMappings();
    const idx = mappings.findIndex(m => m.id === id);
    if (idx >= 0) {
      mappings[idx] = {
        ...mappings[idx],
        ...updates,
        lastUsedAt: new Date().toISOString()
      };
      await StorageService.saveLearnedMapping(mappings[idx]);
    }
  }
}
