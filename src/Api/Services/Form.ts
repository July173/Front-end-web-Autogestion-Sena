import { ENDPOINTS } from '../config/ConfigApi';
/**
 * Creates a new form in the system.
 * @param data - Data of the form to create
 * @returns Promise with the API response
 */
export async function postForm(data) {
	const response = await fetch(ENDPOINTS.form.post, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!response.ok) throw new Error('Error al crear el formulario');
	return response.json();
}


/**
 * Gets the list of all forms.
 * @returns Promise with the array of forms
 */
export async function getForms() {
	const response = await fetch(ENDPOINTS.form.getForm);
	if (!response.ok) throw new Error('Error al obtener formularios');
	return response.json();
}
