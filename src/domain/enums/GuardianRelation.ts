export enum GuardianRelation {
  FATHER = 'father',
  MOTHER = 'mother',
  BROTHER = 'brother',
  SISTER = 'sister',
  UNCLE = 'uncle',
  AUNT = 'aunt',
  GRANDFATHER = 'grandfather',
  GRANDMOTHER = 'grandmother',
  LEGAL_GUARDIAN = 'legal_guardian',
  RELATIVE = 'relative',
  OTHER = 'other',
}

export const GUARDIAN_RELATIONS: readonly string[] = Object.values(GuardianRelation)
