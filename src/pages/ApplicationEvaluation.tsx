import React, { useEffect, useState } from 'react';
import InstructorAssignmentsTable from '@/components/ApplicationEvaluation/InstructorAssignmentsTable';
import { getUserById } from '@/Api/Services/User';

export const ApplicationEvaluation = () => {
  const [instructorId, setInstructorId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInstructorFromStorage = async () => {
      setLoading(true);
      setError(null);
      try {
        const raw = localStorage.getItem('user_dashboard');
        if (!raw) {
          setError('No hay información de usuario en localStorage (user_dashboard)');
          setLoading(false);
          return;
        }
        const parsed = JSON.parse(raw);
        const userId = parsed?.id;
        if (!userId) {
          setError('ID de usuario no encontrado en localStorage');
          setLoading(false);
          return;
        }

        const user = await getUserById(userId);
        // El endpoint devuelve user.instructor con la estructura mostrada por el backend
        const instructor = user?.instructor;
        if (instructor && instructor.id) {
          setInstructorId(Number(instructor.id));
        } else {
          setError('El usuario no tiene un instructor asociado');
        }
      } catch (e: any) {
        setError(e?.message || 'Error al obtener datos de usuario');
      } finally {
        setLoading(false);
      }
    };

    loadInstructorFromStorage();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Asignaciones para valoración previa</h1>

      {loading ? (
        <div className="text-gray-600">Cargando datos del usuario...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : instructorId ? (
        <InstructorAssignmentsTable instructorId={instructorId} filterState={'VERIFICANDO'} />
      ) : (
        <div className="text-gray-600">No se encontró instructor asociado al usuario.</div>
      )}
    </div>
  );
};

export default ApplicationEvaluation;

