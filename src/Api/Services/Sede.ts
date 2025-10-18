import { ENDPOINTS } from '../config/ConfigApi';

/**
 * Gets all headquarters (sedes).
 * Endpoint: GET /general/sedes/
 * @returns Promise with the array of headquarters
 */
export async function getSedes() {
  const response = await fetch(ENDPOINTS.sede.allSedes);
  if (!response.ok) throw new Error('Error al obtener sedes');
  return response.json();
}

/**
 * Creates a new headquarters (sede).
 * Endpoint: POST /general/sedes/
 * @param data - Headquarters data
 * @returns Promise with the created headquarters
 */
export async function createSede(data) {
  const response = await fetch(ENDPOINTS.sede.allSedes, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al crear sede');
  return response.json();
}

/**
 * Updates an existing headquarters (sede).
 * Endpoint: PUT /general/sedes/{id}/
 * @param id - Headquarters ID to update
 * @param data - New headquarters data
 * @returns Promise with the updated headquarters
 */
export async function updateSede(id, data) {
  const url = ENDPOINTS.sede.idSedes.replace('{id}', String(id));
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al actualizar sede');
  return response.json();
}

/**
 * Disables a headquarters (soft delete).
 * Endpoint: DELETE /general/sedes/{id}/soft-delete/
 * @param id - Headquarters ID to disable
 * @returns Promise with the API response
 */
export async function softDeleteSede(id) {
  const url = ENDPOINTS.sede.softDeleteSedes.replace('{id}', String(id));
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Error al deshabilitar sede');
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}