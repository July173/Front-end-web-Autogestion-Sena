import React, { useState } from "react";
import AssignButton from "./AssignButton";
import PdfView from "./PdfView";
import { AssignTableRow, DetailData } from "@/Api/types/Modules/assign.types";
import { getFormRequestById } from "@/Api/Services/RequestAssignaton";
import Paginator from "@/components/Paginator";
import { getDocumentTypesWithEmpty } from "@/Api/Services/TypeDocument";

type DocumentType = { id: number; name: string };

interface AssignTableViewProps {
  rows: AssignTableRow[];
  loading: boolean;
  error: string | null;
  onAction: (row: AssignTableRow) => void;
  actionLabel?: string;
}

const AssignTableView: React.FC<AssignTableViewProps> = ({
  rows,
  loading,
  error,
  onAction,
}) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [requestStates, setRequestStates] = useState<Record<number, string>>({});
  const [page, setPage] = useState<number>(1);

  const rowsPerPage = 10;

  React.useEffect(() => {
    getDocumentTypesWithEmpty().then((types) => {
      setDocumentTypes(
        types
          .filter((t) => typeof t.id === "number")
          .map((t) => ({
            id: Number(t.id),
            name: t.name,
          }))
      );
    });
  }, []);

  React.useEffect(() => {
    const statesMap: Record<number, string> = {};
    rows.forEach((row) => {
      if (row.id) {
        statesMap[row.id] = row.request_state || "SIN_ASIGNAR";
      }
    });
    setRequestStates(statesMap);
  }, [rows]);

  React.useEffect(() => {
    setExpandedIdx(null);
  }, [page]);

  const refreshRequestState = (requestId: number) => {
    const found = rows.find((r) => r.id === requestId);
    setRequestStates((prev) => ({
      ...prev,
      [requestId]: found?.request_state || "SIN_ASIGNAR",
    }));
  };

  const getDocTypeName = (id: number) => {
    const found = documentTypes.find((dt) => Number(dt.id) === Number(id));
    return found ? found.name : "";
  };

  return (
    <div className="w-full rounded-[10px] border border-stone-300/70 bg-white overflow-x-auto">
      <div className="min-w-full">
        <div className="bg-gray-100 flex items-center h-12 border-b border-gray-200">
          <div className="flex-1 px-2 text-center text-stone-500 text-sm max-w-[40px]">#</div>
          <div className="flex-[2] px-2 text-center text-stone-500 text-sm">Nombre</div>
          <div className="flex-[2] px-2 text-center text-stone-500 text-sm">Tipo de identificación</div>
          <div className="flex-[2] px-2 text-center text-stone-500 text-sm">Número</div>
          <div className="flex-[2] px-2 text-center text-stone-500 text-sm">Fecha Solicitud</div>
          <div className="flex-1 px-2 text-center text-stone-500 text-sm">Acción</div>
        </div>

        {loading ? (
          <div className="w-full text-center py-4 text-gray-600">Cargando...</div>
        ) : error ? (
          <div className="w-full text-center py-4 text-red-500">{error}</div>
        ) : rows.length === 0 ? (
          <div className="w-full text-center py-4 text-gray-600">
            No hay datos disponibles en la tabla
          </div>
        ) : (
          (() => {
            const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
            const start = (page - 1) * rowsPerPage;
            const paginatedRows = rows.slice(start, start + rowsPerPage);

            return (
              <>
                {paginatedRows.map((row, idx) => (
                  <React.Fragment key={row.id ?? start + idx}>
                    <div
                      className={`flex items-center border-b border-gray-200 h-12 hover:bg-gray-50 cursor-pointer transition-all ${expandedIdx === idx ? "bg-gray-50" : ""
                        }`}
                      onClick={async () => {
                        if (expandedIdx === idx) {
                          setExpandedIdx(null);
                        } else {
                          setExpandedIdx(idx);
                          setLoadingDetail(true);
                          try {
                            const data = await getFormRequestById(row.id!);
                            setDetail(data.data || null);
                          } catch {
                            setDetail(null);
                          } finally {
                            setLoadingDetail(false);
                          }
                        }
                      }}
                    >
                      <div className="flex-1 px-2 text-center text-sm text-black max-w-[40px]">
                        {start + idx + 1}
                      </div>
                      <div className="flex-[2] px-2 text-center text-sm text-black">
                        {row.name}
                      </div>
                      <div className="flex-[2] px-2 text-center text-sm text-black">
                        {getDocTypeName(row.type_identification)}
                      </div>
                      <div className="flex-[2] px-2 text-center text-sm text-black">
                        {row.number_identificacion}
                      </div>
                      <div className="flex-[2] px-2 text-center text-sm text-black">
                        {row.request_date}
                      </div>
                      <div className="flex-1 px-2 text-center flex justify-center items-center">
                        <AssignButton
                          state={(() => {
                            const backendState = row.id
                              ? requestStates[row.id]
                              : undefined;
                            if (backendState === "ASIGNADO") return "Asignado";
                            if (backendState === "RECHAZADO") return "Rechazado";
                            return "Asignar";
                          })()}
                          requestId={row.id}
                          onClick={() => onAction(row)}
                          onAssignmentComplete={() => row.id && refreshRequestState(row.id)}
                        />
                      </div>
                    </div>

                    {expandedIdx === idx && (
                      <div className="bg-gray-50 px-8 py-6 border-b border-gray-200 animate-fade-in">
                        {loadingDetail ? (
                          <div className="text-center text-gray-600">
                            Cargando información...
                          </div>
                        ) : detail ? (
                          <>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                              <div>
                                <span className="font-semibold">Nombre Aprendiz</span>
                                <br />
                                {detail.name_apprentice}
                              </div>
                              <div>
                                <span className="font-semibold">Tipo Identificación</span>
                                <br />
                                {getDocTypeName(detail.type_identification)}
                              </div>

                              <div>
                                <span className="font-semibold">Número Identificación</span>
                                <br />
                                {detail.number_identification}
                              </div>
                              <div>
                                <span className="font-semibold">Teléfono Aprendiz</span>
                                <br />
                                {detail.phone_apprentice}
                              </div>
                              <div>
                                <span className="font-semibold">Correo Aprendiz</span>
                                <br />
                                {detail.email_apprentice}
                              </div>
                              <div>
                                <span className="font-semibold">Número Ficha</span>
                                <br />
                                {detail.ficha}
                              </div>
                              <div>
                                <span className="font-semibold">Programa</span>
                                <br />
                                {detail.program}
                              </div>
                              <div>
                                <span className="font-semibold">Empresa</span>
                                <br />
                                {detail.boss_name}
                              </div>
                              <div>
                                <span className="font-semibold">Nit Empresa</span>
                                <br />
                                {detail.enterprise_nit}
                              </div>
                              <div>
                                <span className="font-semibold">Ubicación Empresa</span>
                                <br />
                                {detail.enterprise_location}
                              </div>
                              <div>
                                <span className="font-semibold">Correo Empresa</span>
                                <br />
                                {detail.enterprise_email}
                              </div>
                              <div>
                                <span className="font-semibold">Jefe Inmediato</span>
                                <br />
                                {detail.boss_name}
                              </div>
                              <div>
                                <span className="font-semibold">Teléfono Jefe</span>
                                <br />
                                {detail.boss_phone}
                              </div>
                              <div>
                                <span className="font-semibold">Correo Jefe</span>
                                <br />
                                {detail.boss_email}
                              </div>
                              <div>
                                <span className="font-semibold">Cargo Jefe</span>
                                <br />
                                {detail.boss_position}
                              </div>
                              <div>
                                <span className="font-semibold">Regional</span>
                                <br />
                                {detail.regional}
                              </div>
                              <div>
                                <span className="font-semibold">Centro</span>
                                <br />
                                {detail.center}
                              </div>
                              <div>
                                <span className="font-semibold">Sede</span>
                                <br />
                                {detail.sede}
                              </div>
                              <div>
                                <span className="font-semibold">Fecha Solicitud</span>
                                <br />
                                {detail.request_date}
                              </div>
                              <div>
                                <span className="font-semibold">Fecha inicio etapa práctica</span>
                                <br />
                                {detail.date_start_production_stage}
                              </div>
                              <div>
                                <span className="font-semibold">Fecha fin etapa práctica</span>
                                <br />
                                {detail.date_end_production_stage}
                              </div>
                              <div>
                                <span className="font-semibold">Modalidad etapa productiva</span>
                                <br />
                                {detail.modality_productive_stage}
                              </div>
                              <div>
                                <span className="font-semibold">Estado solicitud</span>
                                <br />
                                {detail.request_state}
                              </div>

                              {detail.human_talent && (
                                <>
                                  <div>
                                    <span className="font-semibold">Talento Humano</span>
                                    <br />
                                    {detail.human_talent.name}
                                  </div>
                                  <div>
                                    <span className="font-semibold">Correo Talento Humano</span>
                                    <br />
                                    {detail.human_talent.email}
                                  </div>
                                  <div>
                                    <span className="font-semibold">Teléfono Talento Humano</span>
                                    <br />
                                    {detail.human_talent.phone}
                                  </div>
                                </>
                              )}
                            </div>

                            {detail.pdf_url && (
                              <div className="mt-6">
                                <PdfView
                                  uri={
                                    detail.pdf_url.startsWith("/")
                                      ? "http://127.0.0.1:8000" + detail.pdf_url
                                      : detail.pdf_url
                                  }
                                  initialFullscreen={false}
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center text-gray-600">
                            No hay información disponible
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {/* Footer */}
                <div className="w-full flex items-center justify-between mt-4 p-4">
                  <div className="text-sm text-stone-600">
                    {`Mostrando ${start + 1}-${Math.min(
                      start + paginatedRows.length,
                      rows.length
                    )} de ${rows.length}`}
                  </div>

                  <Paginator
                    page={page}
                    totalPages={totalPages}
                    onPageChange={(p) => setPage(p)}
                  />
                </div>
              </>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default AssignTableView;
