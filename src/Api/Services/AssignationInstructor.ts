import { ENDPOINTS } from '@/Api/config/ConfigApi';
import { ReassignInstructorPayload } from '@/Api/types/Modules/assign.types';

export async function reassignInstructor(payload: ReassignInstructorPayload) {
  const url = ENDPOINTS.AssignationInstructor.reassignInstructor;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(txt || 'Error en reassignInstructor');
  }

  return response.json();
}

export default { reassignInstructor };
