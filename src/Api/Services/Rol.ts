import { ENDPOINTS } from '../config/ConfigApi';

/**
 * Gets the data of a role with its permissions and forms.
 * Endpoint: GET /security/roles/{id}/permissions-forms/
 * @param id - Role ID
 * @returns Promise with the role data
 */
export async function getRolPermissions(id) {
	const url = ENDPOINTS.rol.getRolPermissions.replace('{id}', id.toString());
	const response = await fetch(url);
	if (!response.ok) throw new Error('Error al obtener datos del rol');
	return response.json();
}

/**
 * Updates a role with its forms and permissions.
 * Endpoint: PUT /security/roles/{id}/permissions-forms/
 * @param id - Role ID
 * @param data - Updated role data
 * @returns Promise with the API response
 */
export async function putRolFormPerms(id, data) {
	const url = ENDPOINTS.rol.putRolFormPerms.replace('{id}', id.toString());
	const response = await fetch(url, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) throw new Error('Error al actualizar el rol');
	return response.json();
}
/**
 * Gets the matrix of role and form permissions.
 * Endpoint: GET /security/roles/permissions-forms-matrix/
 * @returns Promise with the permissions matrix
 */
export async function getRolesFormsPerms() {
	const response = await fetch(ENDPOINTS.rol.getRolesFormsPerms);
	if (!response.ok) throw new Error('Error al obtener la matriz de permisos');
	return response.json();
}

/**
 * Changes the state of a role (enable or disable) using the soft-delete endpoint.
 * If the role is active, disables it; if inactive, reactivates it.
 * Endpoint: DELETE /security/roles/{id}/soft-delete/
 * @param id - Role ID
 * @param active - Current state of the role
 * @returns Promise with the API response (true if success)
 */
export async function toggleRoleActive(id: number, active: boolean) {
	// If active, disables (DELETE); if inactive, reactivates (DELETE)
		const url = ENDPOINTS.rol.deleteRolUsers.replace('{id}', id.toString());
		const options: RequestInit = { method: 'DELETE' };
	const response = await fetch(url, options);
	if (!response.ok) {
		let errorMsg = 'Error al cambiar el estado del rol';
		try {
			const data = await response.json();
			if (data && (data.detail || data.error)) {
				errorMsg = data.detail || data.error;
			} else {
				// If there is no detail/error, show the full JSON
				errorMsg = JSON.stringify(data);
			}
		} catch {
			// If not JSON, try to show as plain text
			try {
				const text = await response.text();
				if (text) errorMsg = text;
			} catch {
				// Intentionally left blank: no further error handling needed here
			}
		}
		throw new Error(errorMsg);
	}
	if (response.status === 204) return true;
	try {
		return await response.json();
	} catch {
		return true;
	}
}
// Fetch-get all roles

/**
 * Gets the list of all roles.
 * Endpoint: GET /security/roles/
 * @returns Promise with the array of roles
 */
export async function getRoles() {
	const response = await fetch(ENDPOINTS.rol.getRoles);
	if (!response.ok) throw new Error('Error al obtener roles');
	return response.json();
}


/**
 * Gets the list of roles along with the number of users assigned to each.
 * Endpoint: GET /security/roles/roles-users/
 * @returns Promise with the array of roles and users
 */
export async function getRolesUser() {
	const response = await fetch(ENDPOINTS.rol.getRolUser);
	if (!response.ok) throw new Error('Error al obtener roles con los usuarios');
	return response.json();
}

/**
 * Creates a new role with associated permissions.
 * Endpoint: POST /security/roles/permissions-forms/
 * @param data - Role and permissions data
 * @returns Promise with the API response
 */
export async function postRolPermissions(data) {
	const response = await fetch(ENDPOINTS.rol.postRolPermissions, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) throw new Error('Error al crear el rol');
	return response.json();
}