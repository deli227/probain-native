import { SSSFormation } from "@/hooks/use-sss-formations";

/**
 * Types de catégories de formations SSS
 */
export type FormationCategory =
  | 'cours_base'
  | 'cours_formateur'
  | 'repetition_base'
  | 'repetition_expert';

/**
 * Configuration d'une catégorie de formation
 */
export interface CategoryConfig {
  id: FormationCategory;
  label: string;
  description: string;
  icon: 'BookOpen' | 'GraduationCap' | 'RefreshCw' | 'Award';
}

/**
 * Définition des 4 catégories de formations
 */
export const FORMATION_CATEGORIES: CategoryConfig[] = [
  {
    id: 'cours_base',
    label: 'Cours de base',
    description: 'Pool base, BLS AED, Pool plus, Pro pool, Module lac, Module rivière',
    icon: 'BookOpen',
  },
  {
    id: 'cours_formateur',
    label: 'Cours niveau formateur',
    description: 'Expert Pool, Expert BLS-AED, Expert Lac, Expert Rivière',
    icon: 'GraduationCap',
  },
  {
    id: 'repetition_base',
    label: 'CR niveau base',
    description: 'Cours de répétition niveau base',
    icon: 'RefreshCw',
  },
  {
    id: 'repetition_expert',
    label: 'CR niveau expert',
    description: 'Cours de répétition niveau expert/formateur',
    icon: 'Award',
  },
];

/**
 * Configuration d'une sous-catégorie
 */
export interface SubcategoryConfig {
  id: string;
  label: string;
  keywords: string[];
}

/**
 * Sous-catégories par catégorie principale
 * Utilisées pour le filtre secondaire conditionnel
 */
export const SUBCATEGORIES: Record<FormationCategory, SubcategoryConfig[]> = {
  cours_base: [
    { id: 'pool_base', label: 'Pool base', keywords: ['pool base', 'brevet base'] },
    { id: 'bls_aed', label: 'BLS-AED', keywords: ['bls-aed', 'bls aed', 'bls/aed'] },
    { id: 'pool_plus', label: 'Pool plus', keywords: ['pool plus', 'brevet plus'] },
    { id: 'pro_pool', label: 'Pro pool', keywords: ['pro pool'] },
    { id: 'module_lac', label: 'Module lac', keywords: ['module lac', 'modul see', ' lac', ' see'] },
    { id: 'module_riviere', label: 'Module rivière', keywords: ['module rivière', 'modul fluss', 'rivière', 'fluss'] },
  ],
  cours_formateur: [
    { id: 'expert_pool', label: 'Expert Pool', keywords: ['expert pool'] },
    { id: 'expert_bls', label: 'Expert BLS-AED', keywords: ['expert bls'] },
    { id: 'expert_lac', label: 'Expert Lac', keywords: ['expert lac', 'expert see'] },
    { id: 'expert_riviere', label: 'Expert Rivière', keywords: ['expert rivière', 'expert fluss'] },
  ],
  repetition_base: [
    { id: 'cr_pool_plus', label: 'Pool Plus', keywords: ['pool plus', 'plus pool', 'brevet plus'] },
    { id: 'cr_bls_aed', label: 'BLS AED', keywords: ['bls-aed', 'bls aed', 'bls/aed'] },
    { id: 'cr_pro_pool', label: 'Pro Pool', keywords: ['pro pool'] },
    { id: 'cr_module_lac', label: 'Module Lac', keywords: ['module lac', 'modul see', ' lac', ' see'] },
    { id: 'cr_module_riviere', label: 'Module Rivière', keywords: ['module rivière', 'modul fluss', 'rivière', 'fluss'] },
  ],
  repetition_expert: [],
};

/**
 * Mots-clés pour détecter les cours de répétition/recyclage
 * Note: "CR" = Cours de Répétition dans la nomenclature SSS
 */
const REPETITION_KEYWORDS = [
  'cr ',           // CR suivi d'un espace (ex: "CR B base")
  'cr-',           // CR avec tiret
  ' cr',           // espace + CR (ex: "Module CR")
  'répétition',
  'repetition',
  'recyclage',
  'refresh',
  'wiederholung',
  'auffrischung',
  'repetitionskurs',
];

/**
 * Catégorise une formation selon son titre
 *
 * Logique:
 * 1. Si contient "répétition/recyclage" ET "expert" → repetition_expert
 * 2. Si contient "répétition/recyclage" (sans expert) → repetition_base
 * 3. Si contient "expert" → cours_formateur
 * 4. Sinon → cours_base
 */
export function categorizeFormation(titre: string): FormationCategory {
  const lowerTitre = titre.toLowerCase();

  // Vérifier si c'est un cours de répétition/recyclage
  const isRepetition = REPETITION_KEYWORDS.some(keyword =>
    lowerTitre.includes(keyword)
  );

  // Vérifier si c'est un cours niveau expert/formateur
  const isExpert = lowerTitre.includes('expert');

  // Appliquer la logique de catégorisation
  if (isRepetition && isExpert) {
    return 'repetition_expert';
  }
  if (isRepetition) {
    return 'repetition_base';
  }
  if (isExpert) {
    return 'cours_formateur';
  }
  return 'cours_base';
}

/**
 * Type pour les formations groupées par catégorie
 */
export type GroupedFormations = Record<FormationCategory, SSSFormation[]>;

/**
 * Groupe les formations par catégorie
 */
export function groupFormationsByCategory(
  formations: SSSFormation[]
): GroupedFormations {
  const grouped: GroupedFormations = {
    cours_base: [],
    cours_formateur: [],
    repetition_base: [],
    repetition_expert: [],
  };

  formations.forEach(formation => {
    const category = categorizeFormation(formation.titre || '');
    grouped[category].push(formation);
  });

  return grouped;
}

/**
 * Obtient la configuration d'une catégorie par son ID
 */
export function getCategoryConfig(categoryId: FormationCategory): CategoryConfig | undefined {
  return FORMATION_CATEGORIES.find(cat => cat.id === categoryId);
}

/**
 * Compte le nombre total de formations par catégorie
 */
export function getCategoryCounts(formations: SSSFormation[]): Record<FormationCategory, number> {
  const grouped = groupFormationsByCategory(formations);
  return {
    cours_base: grouped.cours_base.length,
    cours_formateur: grouped.cours_formateur.length,
    repetition_base: grouped.repetition_base.length,
    repetition_expert: grouped.repetition_expert.length,
  };
}
