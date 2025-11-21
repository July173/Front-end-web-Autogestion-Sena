import React, { useState, useEffect } from "react";
import AssignTableView from "../components/assing/AssignTableView";
import FilterBar from "../components/FilterBar";
import { filterRequest } from "@/Api/Services/RequestAssignaton";
import { getPrograms } from "@/Api/Services/Program";
import { AssignTableRow } from "@/Api/types/Modules/assign.types";

const estadoOptions = [
  { value: "ASIGNADO", label: "Asignado" },
  { value: "RECHAZADO", label: "Rechazado" },
  { value: "SIN_ASIGNAR", label: "Sin asignar" },
  { value: "VERIFICANDO", label: "Verificando" },
  { value: "PRE-APROBADO", label: "Pre-aprobado" },

];


const Assign: React.FC = () => {
  const [rows, setRows] = useState<AssignTableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programOptions, setProgramOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    // Load programs dynamically
    getPrograms().then((programs: { id: number; nombre: string }[]) => {
      setProgramOptions([
        { value: "TODOS", label: "Todos los programas" },
        ...programs.map((p) => ({ value: String(p.id), label: p.nombre })),
      ]);
    });
    // Load requests on startup
    setLoading(true);
    setError(null);
    import("@/Api/Services/RequestAssignaton").then(({ getAllRequests }) => {
      getAllRequests()
        .then((result) => setRows(result))
        .catch((err) => setError(err.message || "Error al cargar solicitudes"))
        .finally(() => setLoading(false));
    });
  }, []);

  const handleFilter = async (params: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      // Map filter names to backend
      const payload: Record<string, string> = {};
  if (params.search && params.search.trim() !== "") payload.search = params.search;
  if (params.programa && params.programa !== "TODOS") payload.program_id = params.programa;
  if (params.estado && params.estado !== "TODOS") payload.request_state = params.estado;
      // If no filters, load all requests
      if (Object.keys(payload).length === 0) {
        const { getAllRequests } = await import("@/Api/Services/RequestAssignaton");
        const result = await getAllRequests();
        setRows(result);
      } else {
        const result = await filterRequest(payload);
        setRows(result);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Error al filtrar");
      } else {
        setError("Error al filtrar");
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white relative rounded-[10px] size-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Asignar seguimiento</h2>
        
      </div>
      <FilterBar
        onFilter={handleFilter}
        selects={[
          {
            name: "estado",
            value: "",
            options: estadoOptions,
            placeholder: "Todos los Estados",
          },
           {
            name: "programa",
            value: "",
            options: programOptions,
            placeholder: "Programa",
          }
        ]}
        inputWidth="900px"
        searchPlaceholder="Buscar por nombre, documento..."
      />
      <AssignTableView
        rows={rows}
        loading={loading}
        error={error}
        onAction={() => {}}
        actionLabel="Asignar"
      />
    </div>
  );
};

export default Assign;
