/**
 * Filters assignment requests according to the received parameters.
 * Endpoint: GET /assign/request_asignation/form-request-filtered/
 * @param params - Object with filters (program, status, search, etc)
 * @returns Promise with the filtered array of requests
 */
import { AssignTableRow } from '../types/Modules/assign.types';
export const filterRequest = async (params: Record<string, string>): Promise<AssignTableRow[]> => {
  try {
    // Construir la query string
    const query = Object.entries(params)
      .filter(([_, v]) => v && v !== 'all')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const url = query
      ? `${ENDPOINTS.requestAsignation.filterRequest}?${query}`
      : ENDPOINTS.requestAsignation.filterRequest;
    const response = await fetch(url, {
      method: 'GET',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al filtrar las solicitudes de asignación');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error en filterRequest:', error);
    throw error;
  }
};
import { ENDPOINTS } from '../config/ConfigApi';
import { requestAsignation } from '../types/Modules/assign.types';

/**
 * Gets all assignment requests.
 * Endpoint: GET /assign/request_asignation/form-request-list/
 * @returns Promise with the array of requests
 */
export const getAllRequests = async (): Promise<AssignTableRow[]> => {
  try {
    const response = await fetch(ENDPOINTS.requestAsignation.getFormRequest);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener las solicitudes de asignación');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error en getAllRequests:', error);
    throw error;
  }
};

/**
 * Sends an assignment request.
 * Endpoint: POST /assign/request_asignation/form-request/
 * @param data - Assignment request data
 * @returns Promise with the API response
 */
export const postRequestAssignation = async (data: requestAsignation): Promise<{ success: boolean; data: any }> => {
  try {
    const response = await fetch(ENDPOINTS.requestAsignation.postRequestAssignation, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al enviar la solicitud de asignación');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en postRequestAssignation:', error);
    throw error;
  }
};

/**
 * Uploads a PDF file for the request.
 * Endpoint: POST /assign/form-requests/upload-pdf/
 * @param file - PDF file
 * @param requestId - Optional request ID
 * @returns Promise with the upload result
 */
export const postPdfRequest = async (file: File, requestId?: number): Promise<{ success: boolean; url: string }> => {
  try {
    const formData = new FormData();
    formData.append('pdf_file', file);
    if (requestId) {
      formData.append('request_id', requestId.toString());
    }

    const response = await fetch(ENDPOINTS.requestAsignation.postPdfRequest, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al subir el archivo PDF');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en postPdfRequest:', error);
    throw error;
  }
};

/**
 * Gets the detailed information of the registered request.
 * Endpoint: GET /assign/request_asignation/{id}/form-request-detail/
 * @param requestId - Request ID
 * @returns Promise with the request details
 */

export const getFormRequestById = async (requestId: number): Promise<{ data: any }> => {
  try {
    const url = ENDPOINTS.requestAsignation.getFormRequestById.replace('{id}', String(requestId));
    const response = await fetch(url, {
      method: 'GET',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error obtener detalles de la solicitud');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getFormRequestById:', error);
    throw error;
  }
};


/**
 * Gets the request_asignation by ID.
 * Endpoint: GET /assign/request_asignation/{id}/
 * @param requestId - Request ID
 * @returns Promise with the request data
 */
export const getRequestAsignationById = async (requestId: number): Promise<{ data: any }> => {
  try {
    const url = ENDPOINTS.requestAsignation.getRequestAsignationById.replace('{id}', String(requestId));
    const response = await fetch(url, {
      method: 'GET',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error obtener request asignation');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getRequestAsignationById:', error);
    throw error;
  }
};

/**
 * Assigns an instructor to an assignment request.
 * Endpoint: POST /assign/asignation_instructor/custom-create/
 * @param instructorId - Instructor ID
 * @param requestAsignationId - Request asignation ID
 * @returns Promise with the assignment response
 */
export const assignInstructorToRequest = async (
  instructorId: number,
  requestAsignationId: number
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(ENDPOINTS.requestAsignation.postAssignInstructor, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructor: instructorId,
        request_asignation: requestAsignationId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al asignar instructor');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en assignInstructorToRequest:', error);
    throw error;
  }
};

/**
 * @deprecated Use assignInstructorToRequest instead
 */
export const assignInstructorToApprentice = async (
  instructorId: number,
  apprenticeId: number
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(ENDPOINTS.requestAsignation.postAssignInstructor, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructor: instructorId,
        apprentice: apprenticeId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al asignar instructor');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en assignInstructorToAprendiz:', error);
    throw error;
  }
};

/**
 * Rejects an assignment request.
 * Endpoint: PATCH /assign/request_asignation/{id}/form-request-reject/
 * @param requestId - Request ID
 * @param rejectionMessage - Rejection message
 * @returns Promise with the rejection response
 */
export const rejectRequest = async (requestId: number, rejectionMessage: string): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(
      ENDPOINTS.requestAsignation.patchDenialRequest.replace('{id}', requestId.toString()),
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejectionMessage: rejectionMessage,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al rechazar la solicitud');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en rejectRequest:', error);
    throw error;
  }
};

/**
 * Gets the dashboard information for the apprentice.
 * Endpoint: GET /assign/request_asignation/aprendiz-dashboard/
 * @param apprenticeId - Apprentice ID
 * @returns Promise with the dashboard data
 */
export const getApprenticeDashboard = async (apprenticeId: number): Promise<{ data: any }> => {
  try {
    const url = `${ENDPOINTS.requestAsignation.getApprenticeDashboard}?apprentice_id=${apprenticeId}`;
    console.log('Llamando al endpoint:', url); // for debugging
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener el dashboard del aprendiz');
    }

    const data = await response.json();
    console.log('Datos recibidos del dashboard:', data); // for debugging
    return data;
  } catch (error) {
    console.error('Error en getApprenticeDashboard:', error);
    throw error;
  }
};
