/**
 * Updates the learner limit of an instructor.
 * @param id - Instructor ID
 * @param max_assigned_learners - New limit
 * @returns Promise with the API response
 */
export async function patchInstructorLimit(id: number, max_assigned_learners: number) {
  const url = ENDPOINTS.instructor.patchLimit.replace('{id}', String(id));
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ max_assigned_learners })
  });
  
  if (!response.ok) {
    // Intentar extraer el mensaje de error del backend
    try {
      const errorData = await response.json();
      const errorMessage = errorData.message || errorData.detail || 'Error al actualizar el límite de aprendices';
      throw new Error(errorMessage);
    } catch (parseError) {
      throw new Error('Error al actualizar el límite de aprendices');
    }
  }
  
  return response.json();
}
/**
 * Service for operations related to the Instructor entity.
 * Includes retrieval, registration, update, and query by ID.
 */
import { ENDPOINTS } from '../config/ConfigApi';
import { CreateInstructor, InstructorCustomList, InstructorBackendResponse } from '../types/entities/instructor.types';
import { KnowledgeArea } from '../types/Modules/general.types';
import { getKnowledgeAreas } from './KnowledgeArea';

/**
 * Gets the list of all instructors.
 * @returns Promise with the array of instructors
 */
export async function getInstructores() {
  const response = await fetch(ENDPOINTS.instructor.getAllInstructores);
  if (!response.ok) throw new Error('Error al obtener instructores');
  return response.json();
}

/**
 * Registers a new instructor in the system.
 * @param data - Instructor data to register
 * @returns Promise with the API response
 */
export async function postInstructor(data: CreateInstructor) {
  const response = await fetch(ENDPOINTS.instructor.allInstructores, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Error al registrar instructor');
  return response.json();
}

/**
 * Updates the data of an existing instructor.
 * @param id - Instructor ID
 * @param data - Updated instructor data
 * @returns Promise with the API response
 */
export async function putInstructor(id: string, data: CreateInstructor) {
  const url = ENDPOINTS.instructor.putIdInstructor.replace('{id}', id);
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Error al actualizar instructor');
  return response.json();
}



/**
 * Gets the custom list of instructors for assignment.
 * Transforms backend data to the format expected by the frontend.
 * Includes the knowledge area name.
 * @returns Promise with the array of custom instructors
 */
export async function getInstructoresCustomList(): Promise<InstructorCustomList[]> {
  try {
  // Get instructors and knowledge areas in parallel
    const [instructoresResponse, knowledgeAreasData] = await Promise.all([
      fetch(ENDPOINTS.instructor.getCustomList),
      getKnowledgeAreas()
    ]);

    if (!instructoresResponse.ok) {
      throw new Error('Error al obtener lista de instructores');
    }

    const instructores: InstructorBackendResponse[] = await instructoresResponse.json();
    
  // Create a map of ID -> Knowledge area name
    const areasMap = new Map<number, string>();
    if (Array.isArray(knowledgeAreasData)) {
      knowledgeAreasData.forEach((area: KnowledgeArea) => {
        areasMap.set(area.id, area.name || area.description || `Área ${area.id}`);
      });
    }
    
  // Transform backend data to the format expected by the frontend
    if (Array.isArray(instructores)) {
      return instructores.map((instructor: InstructorBackendResponse): InstructorCustomList => {
  // Build the full name of the instructor
        const nombreCompleto = [
          instructor.first_name,
          instructor.second_name,
          instructor.first_last_name,
          instructor.second_last_name
        ].filter(Boolean).join(' ');
        
  // Get the knowledge area name
        const areaName = instructor.knowledge_area 
          ? areasMap.get(instructor.knowledge_area) || `Área ${instructor.knowledge_area}`
          : undefined;
        
        return {
          id: instructor.id,
          name: nombreCompleto,
          knowledge_area: areaName,
          email: instructor.email,
          assigned_learners: 0, // TODO: backend should return this in the custom-list endpoint
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error en getInstructoresCustomList:', error);
    throw error;
  }
}

/**
 * Gets the list of follow-up instructors.
 * @returns Promise with the array of follow-up instructors
 */
export async function getInstructoresSeguimiento() {
  const response = await fetch(ENDPOINTS.instructor.getAllInstructores + '?is_followup_instructor=true');
  if (!response.ok) throw new Error('Error al obtener instructores de seguimiento');
  return response.json();
}