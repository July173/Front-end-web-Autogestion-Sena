import { ENDPOINTS } from '../config/ConfigApi';

/**
 * Gets the list of enterprises.
 * Endpoint: GET /assign/enterprise/
 */
export const getAllEnterprises = async (): Promise<Array<Record<string, unknown>>> => {
  try {
    const response = await fetch(ENDPOINTS.Enterprise.allEnterprise, { method: 'GET' });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Error al obtener empresas');
    }
    const result = await response.json();
    // The backend may return { data: [...] } or the array directly
    return result.data ?? result ?? [];
  } catch (error) {
    console.error('getAllEnterprises error:', error);
    throw error;
  }
};

