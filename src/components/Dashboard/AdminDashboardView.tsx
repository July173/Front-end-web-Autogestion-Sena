import React, { useEffect, useState } from "react";
import DashboardCharts from "./DashboardCharts";
import { getApprentices } from "../../Api/Services/Apprentice";
import { getAllRequests, getRequestAsignationById } from "../../Api/Services/RequestAssignaton";

/**
 * Admin dashboard home view (extracted from Figma design).
 * Shows statistics and charts for apprentices and requests.
 */
const AdminDashboardView: React.FC = () => {
  const [aprendicesCount, setAprendicesCount] = useState<number | null>(null);
  const [solicitudesSinAsignar, setSolicitudesSinAsignar] = useState<number | null>(null);
  const [solicitudesAsignadas, setSolicitudesAsignadas] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestsData, setRequestsData] = useState<any[]>([]);

  useEffect(() => {
    /**
     * Fetches dashboard data: apprentices, requests, and assignment states.
     * Handles errors and updates state for charts and statistics.
     */
    async function fetchData() {
      setLoading(true);
      try {
        // Apprentices
        const aprendices = await getApprentices();
        console.log("Aprendices recibidos:", aprendices);
        const activos = Array.isArray(aprendices) ? aprendices.filter(a => a.active).length : 0;
        setAprendicesCount(activos);

        // Requests
        const solicitudes = await getAllRequests();
        console.log("Solicitudes recibidas:", solicitudes);
        
        // Validate that requests is an array
        const solicitudesArray = Array.isArray(solicitudes) ? solicitudes : [];

        // Get request_asignation for each request in parallel
        const requestAsignationPromises = solicitudesArray.map(solicitud => 
          getRequestAsignationById(solicitud.id).catch(error => {
            console.error(`Error al obtener request_asignation para solicitud ${solicitud.id}:`, error);
            return null;
          })
        );

        const requestAsignations = await Promise.all(requestAsignationPromises);
        console.log("Request asignations obtenidos:", requestAsignations);

        // Filter out nulls
        const validRequestAsignations = requestAsignations.filter(r => r !== null);
        
        // Save for charts
        setRequestsData(validRequestAsignations);

        // Count by state
        let sinAsignar = 0;
        let asignadas = 0;

        validRequestAsignations.forEach(requestAsignation => {
          if (requestAsignation.request_state === 'SIN_ASIGNAR') {
            sinAsignar++;
          } else if (requestAsignation.request_state === 'ASIGNADO') {
            asignadas++;
          }
        });

        setSolicitudesSinAsignar(sinAsignar);
        setSolicitudesAsignadas(asignadas);

      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err);
        // Only set to 0 if aprendices failed
        setAprendicesCount(prev => prev ?? 0);
        setSolicitudesSinAsignar(0);
        setSolicitudesAsignadas(0);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-lg p-8 w-full">
      <h1 className="text-3xl font-bold text-green-700 mb-6">BIENVENIDO A AUTOGESTIÓN SENA</h1>
      <div className="flex flex-wrap gap-6 justify-center mb-8">
        <div className="bg-white rounded-xl shadow p-4 w-56">
          <p className="text-gray-600 text-sm">Registro de</p>
          <p className="text-gray-800 text-xl font-semibold">Aprendices</p>
          <p className="text-green-600 text-2xl font-bold">
            {loading
              ? "..."
              : typeof aprendicesCount === "number" && !isNaN(aprendicesCount)
                ? aprendicesCount.toLocaleString("es-CO")
                : "0"}
          </p>
          <p className="text-gray-500 text-sm">Aprendices Registrados</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 w-60">
          <p className="text-gray-600 text-sm">Registro de</p>
          <p className="text-gray-800 text-xl font-semibold">Solicitudes sin asignar</p>
          <p className="text-green-600 text-2xl font-bold">
            {loading ? "..." : `${solicitudesSinAsignar} Registros`}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 w-56">
          <p className="text-gray-600 text-sm">Registro de</p>
          <p className="text-gray-800 text-xl font-semibold">Solicitudes asignadas</p>
          <p className="text-green-600 text-2xl font-bold">
            {loading ? "..." : `${solicitudesAsignadas} Registros`}
          </p>
        </div>
      </div>
  <DashboardCharts requestsData={requestsData} />
    </div>
  );
};

export default AdminDashboardView;
