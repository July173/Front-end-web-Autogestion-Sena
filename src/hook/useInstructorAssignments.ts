import { useCallback, useEffect, useState } from 'react';
import { getInstructorAssignments } from '@/Api/Services/Instructor';

type AssignmentRow = any;

export default function useInstructorAssignments(instructorId?: number, filterState?: string) {
  const [data, setData] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id?: number, state?: string) => {
    if (!id) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // If a filterState (e.g. 'VERIFICANDO') is provided, prefer the filtered request endpoint
      if (state && state.toUpperCase() !== 'ALL') {
        // Always fetch all assignments for the instructor from the instructor-specific
        // endpoint so we don't send a request_state filter to the backend. The
        // component will apply the client-side rules (hide SIN_ASIGNAR, include
        // ASIGNADO/RECHAZADO/PRE-APROBADO only when there's an INSTRUCTOR message,
        // show VERIFICANDO normally).
        const res = await getInstructorAssignments(id);
        setData(Array.isArray(res) ? res : (res.data || []));
      } else {
        const res = await getInstructorAssignments(id);
        setData(Array.isArray(res) ? res : (res.data || []));
      }
    } catch (e: any) {
      setError(e?.message || 'Error al obtener asignaciones');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (instructorId) load(instructorId, filterState);
    else setData([]);
  }, [instructorId, filterState, load]);

  const refresh = useCallback(() => {
    if (instructorId) load(instructorId, filterState);
  }, [instructorId, filterState, load]);

  return { data, loading, error, refresh };
}
