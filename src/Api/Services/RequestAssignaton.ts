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
    const raw = result.data || [];
    // Map backend fields to frontend AssignTableRow shape
    return raw.map((it: any) => ({
      id: it.id,
      name: it.nombre || it.name || '',
      type_identification: it.tipo_identificacion ?? it.type_identification ?? 0,
      number_identificacion: it.numero_identificacion != null ? String(it.numero_identificacion) : (it.number_identificacion ? String(it.number_identificacion) : ''),
      request_date: it.fecha_solicitud || it.request_date || '',
      request_state: it.request_state || it.requestState || ''
    }));
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
    const raw = result.data || [];
    return raw.map((it: any) => ({
      id: it.id,
      name: it.nombre || it.name || '',
      type_identification: it.tipo_identificacion ?? it.type_identification ?? 0,
      number_identificacion: it.numero_identificacion != null ? String(it.numero_identificacion) : (it.number_identificacion ? String(it.number_identificacion) : ''),
      request_date: it.fecha_solicitud || it.request_date || '',
      request_state: it.request_state || it.requestState || ''
    }));
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
    const result = await response.json();
    const raw = result.data || result;

    // Map backend Spanish field names to frontend DetailData shape
    const mapped: any = {
      apprentice: raw.aprendiz_id ?? raw.apprentice ?? undefined,
      name_apprentice: raw.nombre_aprendiz || raw.name_apprentice || raw.nombre || '',
      type_identification: raw.tipo_identificacion ?? raw.type_identification ?? 0,
      number_identification: raw.numero_identificacion != null ? String(raw.numero_identificacion) : (raw.number_identification ? String(raw.number_identification) : ''),
      phone_apprentice: raw.telefono_aprendiz ?? raw.phone_apprentice ?? raw.phone_apprentice,
      email_apprentice: raw.correo_aprendiz || raw.email_apprentice || raw.email || '',
      ficha: raw.ficha_id ?? raw.ficha ?? raw.ficha,
      numero_ficha: raw.numero_ficha ?? raw.numero_ficha ?? undefined,
      program: raw.programa || raw.program || undefined,
      enterprise_name: raw.empresa_nombre || raw.enterprise_name || undefined,
      enterprise_nit: raw.empresa_nit ?? raw.enterprise_nit ?? undefined,
      enterprise_location: raw.empresa_ubicacion || raw.enterprise_location || undefined,
      enterprise_email: raw.empresa_correo || raw.enterprise_email || undefined,
      boss_name: raw.jefe_nombre || raw.boss_name || undefined,
      boss_phone: raw.jefe_telefono ?? raw.boss_phone ?? undefined,
      boss_email: raw.jefe_correo || raw.boss_email || undefined,
      boss_position: raw.jefe_cargo || raw.boss_position || undefined,
      regional: raw.regional || undefined,
      center: raw.center || undefined,
      sede: raw.sede || undefined,
      request_date: raw.fecha_solicitud || raw.request_date || undefined,
      date_start_production_stage: raw.fecha_inicio_etapa_practica || raw.date_start_production_stage || undefined,
      date_end_production_stage: raw.fecha_fin_etapa_practica || raw.date_end_production_stage || undefined,
      modality_productive_stage: raw.modality_productive_stage || raw.modality_productive_stage || undefined,
      request_state: raw.request_state || undefined,
      pdf_url: raw.pdf_url ?? undefined,
      human_talent: raw.talento_humano ? {
        name: raw.talento_humano.nombre || raw.talento_humano.name || undefined,
        email: raw.talento_humano.correo || raw.talento_humano.email || undefined,
        phone: raw.talento_humano.telefono ?? raw.talento_humano.phone ?? undefined,
      } : (raw.human_talent || undefined)
    };

    return { data: mapped };
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
  requestAsignationId: number,
  extra?: { content?: string; type_message?: string; request_state?: string }
): Promise<{ success: boolean }> => {
  try {
    const payload: any = {
      instructor: instructorId,
      request_asignation: requestAsignationId,
    };

    if (extra) {
      if (typeof extra.content === 'string') payload.content = extra.content;
      if (typeof extra.type_message === 'string') payload.type_message = extra.type_message;
      if (typeof extra.request_state === 'string') payload.request_state = extra.request_state;
    }

    const response = await fetch(ENDPOINTS.requestAsignation.postAssignInstructor, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
