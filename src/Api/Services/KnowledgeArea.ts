/**
 * Service for operations related to the Knowledge Area entity.
 * Includes retrieval of knowledge areas.
 */
import { ENDPOINTS } from '../config/ConfigApi';


/**
 * Gets the list of available knowledge areas.
 * @returns Promise with the array of knowledge areas
 */
export async function getKnowledgeAreas() {
  const response = await fetch(ENDPOINTS.KnowledgeArea.allKnowledgeAreas);
  if (!response.ok) throw new Error('Error al obtener áreas de conocimiento');
  return response.json();
}

/**
 * Creates a new knowledge area.
 * @param data - Knowledge area data
 * @returns Promise with the created knowledge area
 */
export async function createKnowledgeArea(data) {
  const response = await fetch(ENDPOINTS.KnowledgeArea.allKnowledgeAreas, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al crear área de conocimiento');
  return response.json();
}

/**
 * Deletes (disables) an existing knowledge area.
 * @param id - ID of the knowledge area to delete
 * @returns Promise with the deleted knowledge area
 */
export async function deleteKnowledgeArea(id: number | string) {
  const url = ENDPOINTS.KnowledgeArea.deleteIdKnowledgeArea.replace('{id}', String(id));
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) throw new Error('Error al deshabilitar área');
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

/**
 * Updates an existing knowledge area.
 * @param id - ID of the knowledge area to update
 * @param data - New data for the knowledge area
 * @returns Promise with the updated knowledge area
 */
export async function updateKnowledgeArea(id: number | string, data) {
  const url = ENDPOINTS.KnowledgeArea.IdKnowledgeArea.replace('{id}', String(id));
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al actualizar área');
  return response.json();
}