import React, { useEffect, useState } from "react";
import { getApprenticeDashboard } from "@/Api/Services/RequestAssignaton";


/**
 * Props for AprprendiceDashboardView component.
 * @typedef {Object} ApprenticeDashboardProps
 * @property {string} [name] - Apprentice's name
 * @property {number} [apprenticeId] - Apprentice ID
 */
interface AprendizDashboardProps {
  name?: string;
  apprenticeId?: number;
}


/**
 * Dashboard data structure for apprentice dashboard.
 * @typedef {Object} DashboardData
 * @property {boolean} has_request - Whether the apprentice has a request
 * @property {Object|null} request - Request details
 * @property {Object|null} instructor - Instructor details
 * @property {string|null} request_state - State of the request
 */
interface DashboardData {
  has_request: boolean;
  request: {
    id: number;
    enterprise_name: string | null;
    boss_name: string | null;
    modality: string | null;
    start_date: string;
    end_date: string;
    request_date: string;
    request_state: string;
    pdf_url: string | null;
  } | null;
  instructor: {
    id: number;
    first_name: string;
    second_name: string | null;
    first_last_name: string;
    second_last_name: string | null;
    email: string | null;
    phone: string;
    knowledge_area: string | null;
    assigned_at: string;
  } | null;
  request_state: string | null;
}

/**
 * Apprentice dashboard view.
 * Shows request status, assigned instructor, and request details.
 * @param {AprendizDashboardProps} props
 */
const AprendizDashboardView: React.FC<AprendizDashboardProps> = ({ name, apprenticeId }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);


  /**
   * Loads dashboard data for the apprentice.
   */
  const loadDashboardData = React.useCallback(async () => {
    if (!apprenticeId) return;
    
    try {
  setLoading(true);
  const response = await getApprenticeDashboard(apprenticeId);
  setDashboardData(response.data as DashboardData);
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [apprenticeId]);

  useEffect(() => {
    if (apprenticeId) {
      loadDashboardData();
    }
  }, [apprenticeId, loadDashboardData]);


  /**
   * Gets initials for the assigned instructor.
   * @param {DashboardData['instructor']} instructor
   * @returns {string}
   */
  const getInstructorInitials = (instructor: DashboardData['instructor']) => {
    if (!instructor) return "CW";
    const firstInitial = instructor.first_name?.charAt(0) || "";
    const lastInitial = instructor.first_last_name?.charAt(0) || "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };


  /**
   * Gets full name for the assigned instructor.
   * @param {DashboardData['instructor']} instructor
   * @returns {string}
   */
  const getInstructorFullName = (instructor: DashboardData['instructor']) => {
    if (!instructor) return "No asignado";
    return `${instructor.first_name || ""} ${instructor.second_name || ""} ${instructor.first_last_name || ""} ${instructor.second_last_name || ""}`.trim();
  };


  /**
   * Formats a date string to DD/MM/YYYY.
   * @param {string} dateString
   * @returns {string}
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };


  /**
   * Gets information for the current request state.
   * @returns {object|null}
   */
  const getRequestStateInfo = () => {
    if (!dashboardData?.request_state) return null;
    
    const states = {
      'PENDIENTE': { text: 'Solicitud enviada', desc: 'Has enviado tu solicitud de etapa productiva', icon: '⏱️', color: 'text-blue-600' },
      'EN_REVISION': { text: 'En revisión', desc: 'Tu solicitud está siendo revisada por el coordinador', icon: '🔍', color: 'text-yellow-600' },
      'ASIGNADO': { text: 'Asignación de instructor', desc: 'Se te asignará un instructor de seguimiento', icon: '👤', color: 'text-green-600' },
      'RECHAZADO': { text: 'Solicitud rechazada', desc: 'Tu solicitud ha sido rechazada', icon: '❌', color: 'text-red-600' },
    };
    
    return states[dashboardData.request_state as keyof typeof states] || states['PENDIENTE'];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 w-full">
        <div className="text-center py-10">
          <p className="text-xl">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 w-full">
  {/* Welcome banner */}
      <div className="bg-green-600 rounded-lg flex items-center px-5 py-14 w-[1000px] mb-4">
        <div className="bg-gray-200/50 rounded-full flex items-center justify-center w-[70px] h-[70px] mr-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="white" viewBox="0 0 16 16">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
          </svg>
        </div>
        <div className="flex flex-col text-white">
          <p className="text-3xl font-bold mb-0">¡ Bienvenido !</p>
          <p className="text-2xl font-normal mb-0">{name || "Aprendiz"}</p>
          <p className="text-lg font-normal">Gestione Desde Aquí Tus Procesos De Formación</p>
        </div>
      </div>

      <div className="flex gap-5 w-full justify-center">
  {/* Request status */}
        <div className="bg-white rounded-lg shadow w-[495px] p-6 flex flex-col">
          <div className="bg-blue-700/70 rounded-lg w-full py-4 mb-6 flex items-center justify-center">
            <p className="text-xl font-bold text-black">Estado de tu solicitud</p>
          </div>
          
          {!dashboardData?.has_request ? (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gray-300/70 rounded-full w-[100px] h-[100px] flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="gray" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                </svg>
              </div>
              <p className="text-lg text-black font-semibold">Sin solicitudes para tu etapa productiva</p>
              <p className="text-base text-black text-center">Aún no has solicitado ningún proceso para tu etapa productiva, por favor registra una solicitud</p>
              <button className="bg-green-600 text-white rounded-lg px-6 py-3 font-medium mt-2 hover:bg-green-700">
                Hacer una solicitud
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* State timeline */}
              <div className="flex flex-col gap-3 px-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">Solicitud enviada</p>
                    <p className="text-sm text-gray-600">Has enviado tu solicitud de etapa productiva</p>
                  </div>
                </div>

                {['EN_REVISION', 'ASIGNADO'].includes(dashboardData.request_state || '') && (
                  <>
                    <div className="h-8 w-0.5 bg-gray-300 ml-5"></div>
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                        dashboardData.request_state === 'EN_REVISION' || dashboardData.request_state === 'ASIGNADO' 
                          ? 'bg-blue-500' 
                          : 'bg-gray-300'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">En revisión</p>
                        <p className="text-sm text-gray-600">Tu solicitud está siendo revisada por el coordinador</p>
                        {dashboardData.request_state === 'EN_REVISION' && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{width: '60%'}}></div>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">En Progreso...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {dashboardData.request_state === 'ASIGNADO' && (
                  <>
                    <div className="h-8 w-0.5 bg-gray-300 ml-5"></div>
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
                          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">Asignación de instructor</p>
                        <p className="text-sm text-gray-600">Se te asignará un instructor de seguimiento</p>
                      </div>
                    </div>
                    <div className="h-8 w-0.5 bg-gray-300 ml-5"></div>
                    <div className="flex items-start gap-3">
                      <div className="bg-gray-300 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">Proceso aprobado</p>
                        <p className="text-sm text-gray-600">Tu solicitud ha sido aprobada completamente</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

          {/* Right column */}
        <div className="flex flex-col gap-5 w-[486px]">
          {/* Your assigned instructor */}
          <div className="bg-white rounded-lg shadow w-full p-6 flex flex-col items-center">
            <div className="bg-[#d7b8ff] rounded-lg w-full py-4 mb-4 flex items-center justify-center">
              <p className="text-lg font-bold text-black">Tu Instructor asignado</p>
            </div>
            
            {!dashboardData?.instructor ? (
              <div className="flex flex-col items-center gap-2">
                <div className="bg-gray-400/70 rounded-full w-[100px] h-[100px] flex items-center justify-center mb-2">
                  <p className="text-2xl font-semibold text-white">CW</p>
                </div>
                <p className="text-xl font-semibold text-black">No asignado</p>
                <div className="bg-gray-400/50 rounded-lg px-4 py-2">
                  <p className="text-xl font-semibold text-black">pendiente de Asignar</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="bg-purple-400/70 rounded-full w-[100px] h-[100px] flex items-center justify-center mb-2">
                  <p className="text-3xl font-bold text-white">{getInstructorInitials(dashboardData.instructor)}</p>
                </div>
                <p className="text-xl font-semibold text-black text-center">{getInstructorFullName(dashboardData.instructor)}</p>
                <p className="text-base text-gray-600">{dashboardData.instructor.knowledge_area || "Área de conocimiento"}</p>
                {dashboardData.instructor.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z"/>
                    </svg>
                    <p className="text-sm">{dashboardData.instructor.email}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"/>
                  </svg>
                  <p className="text-sm">{dashboardData.instructor.phone}</p>
                </div>
                {dashboardData.instructor.email && (
                  <button className="bg-green-600 text-white rounded-lg px-6 py-2 font-medium mt-2 hover:bg-green-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z"/>
                    </svg>
                    Enviar Email
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Request details */}
          <div className="bg-white rounded-lg shadow w-full p-6 flex flex-col">
            <div className="bg-[#fae17e] rounded-lg w-full py-4 mb-4 flex items-center justify-center">
              <p className="text-lg font-bold text-black">Detalle de tu Solicitud</p>
            </div>
            
            {!dashboardData?.has_request ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xl font-semibold text-black">Sin solicitud</p>
                <p className="text-base text-black text-center">Aparecerán los detalles de la solicitud una vez sea aprobado</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Empresa</p>
                    <p className="font-semibold">{dashboardData.request?.enterprise_name || "No especificada"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Jefe Inmediato</p>
                    <p className="font-semibold">{dashboardData.request?.boss_name || "No asignado"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Fecha inicio</p>
                    <p className="font-semibold">{dashboardData.request?.start_date ? formatDate(dashboardData.request.start_date) : "No especificada"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Enviado el</p>
                    <p className="font-semibold">{dashboardData.request?.request_date ? formatDate(dashboardData.request.request_date) : "No disponible"}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-semibold">Tipo de solicitud: <span className="font-normal">{dashboardData.request?.modality || "Etapa práctica"}</span></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AprendizDashboardView;
