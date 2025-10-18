/**
 * Service for operations related to the Program entity.
 * Includes retrieval of programs and fichas associated with a program.
 */
import { ENDPOINTS } from '../config/ConfigApi';

/**
 * Gets the list of available programs.
 * @returns Promise with the array of programs
 */
export async function getPrograms() {
  const response = await fetch(ENDPOINTS.program.allPrograms);
  if (!response.ok) throw new Error('Error al obtener programas');
  return response.json();
}

/**
 * Gets the fichas associated with a specific program.
 * @param programId - Program ID
 * @returns Promise with the array of program fichas
 */
export async function getProgramFichas(programId: number | string) {
  const url = ENDPOINTS.program.getProgramFicha.replace('{id}', String(programId));
  const response = await fetch(url);
  if (!response.ok) throw new Error('Error al obtener fichas del programa');
  return response.json();
}

/**
 * Creates a new program.
 * @param data - Program data
 * @returns Promise with the created program
 */
export async function createProgram(data) {
  const response = await fetch(ENDPOINTS.program.allPrograms, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al crear programa');
  return response.json();
}

/**
 * Deletes (disables) an existing program.
 * @param id - Program ID to delete
 * @returns Promise with the deleted program
 */
export async function deleteProgram(id: number | string) {
  const url = ENDPOINTS.program.deleteIdProgram.replace('{id}', String(id));
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) throw new Error('Error al deshabilitar programa');
  // Only try to read JSON if there is content
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

/**
 * Updates an existing program.
 * @param id - Program ID to update
 * @param data - New program data
 * @returns Promise with the updated program
 */
export async function updateProgram(id: number | string, data) {
  const url = ENDPOINTS.program.IdProgram.replace('{id}', String(id));
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al actualizar programa');
  return response.json();
}