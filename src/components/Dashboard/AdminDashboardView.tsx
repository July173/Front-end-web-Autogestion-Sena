import React, { useEffect, useState } from "react";
import DashboardCharts from "./DashboardCharts";
import { getApprentices } from "../../Api/Services/Apprentice";
import { getAllRequests, getRequestAsignationById } from "../../Api/Services/RequestAssignaton";
import { User } from "../../Api/types/entities/user.types";

interface RequestData {
  fecha_solicitud?: string;
  request_date?: string;
  date?: string;
  request_state: "ASIGNADO" | "SIN_ASIGNAR";
}

/**
 * Admin dashboard home view (extracted from Figma design).
 * Shows statistics and charts for apprentices and requests.
 */
const AdminDashboardView: React.FC = () => {
  const [aprendicesCount, setAprendicesCount] = useState<number | null>(null);
  const [solicitudesSinAsignar, setSolicitudesSinAsignar] = useState<number | null>(null);
  const [solicitudesAsignadas, setSolicitudesAsignadas] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestsData, setRequestsData] = useState<RequestData[]>([]);
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    // Leer los datos del usuario desde el localStorage
    const storedUser = localStorage.getItem("user_dashboard");
    
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        
        setUserData(parsedUser);
      } catch (error) {
        console.error("Error al parsear los datos del usuario desde el localStorage en AdminDashboardView:", error);
      }
    } else {
      console.warn("No se encontraron datos del usuario en localStorage en AdminDashboardView."); // Log de depuración
    }
  }, []);

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
       
        const activos = Array.isArray(aprendices) ? aprendices.filter(a => a.active).length : 0;
        setAprendicesCount(activos);

        // Requests
        const solicitudes = await getAllRequests();
      
        
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
      } finally {
        setLoading(false);
      }
    }

    if (userData) {
      fetchData();
    } else {
      console.warn("No se encontró userData para cargar el dashboard."); // Log de depuración
    }
  }, [userData]);

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-8 w-full">
      <h1 className="text-3xl font-bold text-green-700 mb-6">BIENVENIDO, {userData.person?.first_name?.toUpperCase()}!</h1>
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
