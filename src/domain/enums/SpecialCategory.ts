export enum SpecialCategory {
  ORPHAN = 'orphan',
  RETURNED_REFUGEE = 'returned_refugee',
  IDP = 'idp',
  KUCHI = 'kuchi',
  DISABILITY = 'disability',
  MARTYRS_CHILD = 'martyrs_child',
  LOW_INCOME = 'low_income',
  SIBLING_IN_SCHOOL = 'sibling_in_school',
}

export const SPECIAL_CATEGORIES: readonly string[] = Object.values(SpecialCategory)
