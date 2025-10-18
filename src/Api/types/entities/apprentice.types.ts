/**
 * Types and interfaces for the Apprentice entity.
 * Includes structure and registration data for apprentices.
 */
/**
 * Types and interfaces for the Apprentice entity.
 * Includes structure and registration data for apprentices.
 */
export interface Apprentice {
  id: string;
  person: number;
  ficha: number;
  active: boolean;
}

export interface CreateApprentice {
  type_identification: string;
  number_identification: string;
  first_name: string;
  second_name?: string;
  first_last_name: string;
  second_last_name?: string;
  phone_number: string;
  email: string;
  program: number;
  ficha: string;
  role?: number;
}
