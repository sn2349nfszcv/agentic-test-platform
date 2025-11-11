// Generate realistic user personas for testing

import { UserPersona, PersonaType } from '../core/types';

export class PersonaGenerator {
  /**
   * Generate a random persona of a given type
   */
  static generate(type: PersonaType, index: number): UserPersona {
    const basePersonas = this.getBasePersonas();
    const template = basePersonas[type];

    return {
      id: `persona_${type.toLowerCase()}_${index}`,
      name: `${template.namePrefix} ${index}`,
      type,
      characteristics: this.generateCharacteristics(type),
      goals: template.goals,
      painPoints: template.painPoints,
      decisionPatterns: this.generateDecisionPatterns(type),
    };
  }

  /**
   * Generate multiple personas (mixed types)
   */
  static generateBatch(count: number): UserPersona[] {
    const personas: UserPersona[] = [];
    const types = Object.values(PersonaType);

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      personas.push(this.generate(type, i + 1));
    }

    return personas;
  }

  /**
   * Get base persona templates
   */
  private static getBasePersonas() {
    return {
      [PersonaType.BEGINNER]: {
        namePrefix: 'Novice Author',
        goals: [
          'Learn the platform basics',
          'Complete first book upload',
          'Generate initial marketing content',
          'Understand what features are available',
        ],
        painPoints: [
          'Overwhelmed by too many options',
          'Unsure where to start',
          'Needs clear guidance',
          'Afraid of making mistakes',
        ],
      },
      [PersonaType.INTERMEDIATE]: {
        namePrefix: 'Active Author',
        goals: [
          'Optimize marketing campaigns',
          'Improve content quality',
          'Try advanced features',
          'Track performance metrics',
        ],
        painPoints: [
          'Wants better results faster',
          'Balancing quality vs speed',
          'Managing multiple books',
          'Understanding analytics',
        ],
      },
      [PersonaType.EXPERT]: {
        namePrefix: 'Pro Marketer',
        goals: [
          'Maximize automation',
          'Fine-tune AI outputs',
          'Scale across many books',
          'Integrate with existing workflows',
        ],
        painPoints: [
          'Wants full control and customization',
          'Needs advanced analytics',
          'API access for automation',
          'Bulk operations',
        ],
      },
      [PersonaType.POWER_USER]: {
        namePrefix: 'Publishing House',
        goals: [
          'Manage team workflows',
          'Process books at scale',
          'Custom integrations',
          'White-label capabilities',
        ],
        painPoints: [
          'Complex approval processes',
          'Multi-user coordination',
          'Brand consistency',
          'Cost efficiency at scale',
        ],
      },
    };
  }

  /**
   * Generate characteristics based on persona type
   */
  private static generateCharacteristics(type: PersonaType) {
    const ranges = {
      [PersonaType.BEGINNER]: {
        techSavvy: [2, 4],
        patience: [4, 6],
        riskTolerance: [2, 4],
        detailOriented: [5, 7],
      },
      [PersonaType.INTERMEDIATE]: {
        techSavvy: [5, 7],
        patience: [5, 7],
        riskTolerance: [5, 7],
        detailOriented: [6, 8],
      },
      [PersonaType.EXPERT]: {
        techSavvy: [8, 10],
        patience: [6, 8],
        riskTolerance: [7, 9],
        detailOriented: [7, 9],
      },
      [PersonaType.POWER_USER]: {
        techSavvy: [9, 10],
        patience: [7, 9],
        riskTolerance: [8, 10],
        detailOriented: [8, 10],
      },
    };

    const range = ranges[type];
    return {
      techSavvy: this.randomInRange(range.techSavvy[0], range.techSavvy[1]),
      patience: this.randomInRange(range.patience[0], range.patience[1]),
      riskTolerance: this.randomInRange(range.riskTolerance[0], range.riskTolerance[1]),
      detailOriented: this.randomInRange(range.detailOriented[0], range.detailOriented[1]),
    };
  }

  /**
   * Generate decision patterns based on persona type
   */
  private static generateDecisionPatterns(type: PersonaType) {
    const patterns = {
      [PersonaType.BEGINNER]: {
        explorationVsEfficiency: 0.7, // More exploratory
        errorHandling: 'seek-help' as const,
        featureAdoption: 'cautious' as const,
      },
      [PersonaType.INTERMEDIATE]: {
        explorationVsEfficiency: 0.5, // Balanced
        errorHandling: 'retry' as const,
        featureAdoption: 'cautious' as const,
      },
      [PersonaType.EXPERT]: {
        explorationVsEfficiency: 0.3, // More efficient
        errorHandling: 'retry' as const,
        featureAdoption: 'early' as const,
      },
      [PersonaType.POWER_USER]: {
        explorationVsEfficiency: 0.2, // Very efficient
        errorHandling: 'retry' as const,
        featureAdoption: 'early' as const,
      },
    };

    return patterns[type];
  }

  /**
   * Generate random number in range
   */
  private static randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get persona distribution for realistic testing
   * Typically: 40% intermediate, 30% beginner, 20% expert, 10% power
   */
  static getRealisticDistribution(totalCount: number): PersonaType[] {
    const distribution: PersonaType[] = [];

    const beginnerCount = Math.floor(totalCount * 0.3);
    const intermediateCount = Math.floor(totalCount * 0.4);
    const expertCount = Math.floor(totalCount * 0.2);
    const powerCount = totalCount - beginnerCount - intermediateCount - expertCount;

    for (let i = 0; i < beginnerCount; i++) {
      distribution.push(PersonaType.BEGINNER);
    }
    for (let i = 0; i < intermediateCount; i++) {
      distribution.push(PersonaType.INTERMEDIATE);
    }
    for (let i = 0; i < expertCount; i++) {
      distribution.push(PersonaType.EXPERT);
    }
    for (let i = 0; i < powerCount; i++) {
      distribution.push(PersonaType.POWER_USER);
    }

    // Shuffle
    return distribution.sort(() => Math.random() - 0.5);
  }
}
