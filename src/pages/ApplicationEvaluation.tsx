import React, { useEffect, useState } from 'react';
import InstructorAssignmentsTable from '@/components/ApplicationEvaluation/InstructorAssignmentsTable';
import { getUserById } from '@/Api/Services/User';
import FilterBar from '@/components/FilterBar';
import ReloadButton from '@/components/ReloadButton';
import AssignTableView from '@/components/assing/AssignTableView';
import { getPrograms } from '@/Api/Services/Program';
import { getModalityProductiveStages } from '@/Api/Services/ModalityProductiveStage';
import { filterRequest } from '@/Api/Services/RequestAssignaton';
import { AssignTableRow } from '@/Api/types/Modules/assign.types';

export const ApplicationEvaluation = () => {
  const [instructorId, setInstructorId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AssignTableRow[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [programOptions, setProgramOptions] = useState<{ value: string; label: string }[]>([]);
  const [modalityOptions, setModalityOptions] = useState<{ value: string; label: string }[]>([]);

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
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || 'Error al obtener datos de usuario');
      } finally {
        setLoading(false);
      }
    };

    loadInstructorFromStorage();
  }, []);

  // Load programs, modalities and initial rows (similar to Assign page)
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const programs = await getPrograms();
        setProgramOptions([
          { value: 'TODOS', label: 'Todos los programas' },
          ...programs.map((p: { id: number; nombre: string }) => ({ value: String(p.id), label: p.nombre }))
        ]);
      } catch (err) {
        // ignore
      }

      try {
        const mods = await getModalityProductiveStages();
        setModalityOptions([
          { value: 'TODOS', label: 'Todas las Modalidades' },
          ...(Array.isArray(mods) ? mods.map((m: { id: number; name_modality: string }) => ({ value: String(m.id), label: m.name_modality })) : [])
        ]);
      } catch (err) {
        // ignore
      }
    };

    loadAssets();
  }, []);

  // Load initial table rows, optionally filtered by instructorId and default state VERIFICANDO
  useEffect(() => {
    const loadInitial = async () => {
      setTableLoading(true);
      setTableError(null);
      try {
        if (instructorId) {
          // Try to filter by instructor and state VERIFICANDO
          const payload: Record<string, string> = { request_state: 'VERIFICANDO', instructor_id: String(instructorId) };
          const result = await filterRequest(payload);
          setRows(result);
        } else {
          // Fallback: load all
          const { getAllRequests } = await import('@/Api/Services/RequestAssignaton');
          const result = await getAllRequests();
          setRows(result as AssignTableRow[]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setTableError(message || 'Error al cargar asignaciones');
      } finally {
        setTableLoading(false);
      }
    };

    // Only load after instructorId resolved (or immediately if undefined)
    if (instructorId !== undefined) loadInitial();
  }, [instructorId]);

  return (
    <div className="bg-white relative rounded-[10px] size-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Asignaciones para valoración previa</h1>
        <div>
          <ReloadButton onClick={async () => {
            // reload table rows
            setTableLoading(true);
            setTableError(null);
            try {
              if (instructorId) {
                const payload: Record<string, string> = { request_state: 'VERIFICANDO', instructor_id: String(instructorId) };
                const result = await filterRequest(payload);
                setRows(result);
              } else {
                const { getAllRequests } = await import('@/Api/Services/RequestAssignaton');
                const result = await getAllRequests();
                setRows(result as AssignTableRow[]);
              }
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              setTableError(message || 'Error al recargar asignaciones');
            } finally {
              setTableLoading(false);
            }
          }} title="Recargar" />
        </div>
      </div>

      <FilterBar
        onFilter={async (params: Record<string, string>) => {
          setTableLoading(true);
          setTableError(null);
          try {
            const payload: Record<string, string> = {};
            if (params.search && params.search.trim() !== '') payload.search = params.search;
            if (params.programa && params.programa !== 'TODOS') payload.program_id = params.programa;
            if (params.modalidad && params.modalidad !== 'TODOS') payload.modality_productive_stage = params.modalidad;
            // always filter by VERIFICANDO for this page
            payload.request_state = 'VERIFICANDO';
            if (instructorId) payload.instructor_id = String(instructorId);

            if (Object.keys(payload).length === 0) {
              const { getAllRequests } = await import('@/Api/Services/RequestAssignaton');
              const result = await getAllRequests();
              setRows(result as AssignTableRow[]);
            } else {
              const result = await filterRequest(payload);
              setRows(result as AssignTableRow[]);
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setTableError(message || 'Error al filtrar');
            setRows([]);
          } finally {
            setTableLoading(false);
          }
        }}
        selects={[
          { name: 'estado', value: 'VERIFICANDO', options: [{ value: 'VERIFICANDO', label: 'Verificando' }], placeholder: 'Estado' },
          { name: 'modalidad', value: '', options: modalityOptions, placeholder: 'Modalidad' },
          { name: 'programa', value: '', options: programOptions, placeholder: 'Programa' }
        ]}
        inputWidth="900px"
        searchPlaceholder="Buscar por nombre, documento..."
      />

      <AssignTableView
        rows={rows}
        loading={tableLoading}
        error={tableError}
        onAction={() => {}}
        onRefresh={async () => {
          // same as reload
          setTableLoading(true);
          setTableError(null);
          try {
            if (instructorId) {
              const payload: Record<string, string> = { request_state: 'VERIFICANDO', instructor_id: String(instructorId) };
              const result = await filterRequest(payload);
              setRows(result);
            } else {
              const { getAllRequests } = await import('@/Api/Services/RequestAssignaton');
              const result = await getAllRequests();
              setRows(result as AssignTableRow[]);
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setTableError(message || 'Error al recargar asignaciones');
          } finally {
            setTableLoading(false);
          }
        }}
        actionLabel="Asignar"
      />
    </div>
  );
};

export default ApplicationEvaluation;

