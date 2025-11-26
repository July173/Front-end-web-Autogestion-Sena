import { useCallback, useEffect, useState } from 'react';
import { getInstructorAssignments } from '@/Api/Services/Instructor';

type AssignmentRow = any;

export default function useInstructorAssignments(instructorId?: number) {
  const [data, setData] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id?: number) => {
    if (!id) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getInstructorAssignments(id);
      setData(Array.isArray(res) ? res : (res.data || []));
    } catch (e: any) {
      setError(e?.message || 'Error al obtener asignaciones');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (instructorId) load(instructorId);
    else setData([]);
  }, [instructorId, load]);

  const refresh = useCallback(() => {
    if (instructorId) load(instructorId);
  }, [instructorId, load]);

  return { data, loading, error, refresh };
}
