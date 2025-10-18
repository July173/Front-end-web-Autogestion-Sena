import AdminDashboardView from "../components/Dashboard/AdminDashboardView";
import ApprenticeDashboardView from "../components/Dashboard/ApprenticeDashboardView";
import InstructorDashboard from "../components/Dashboard/InstructorDashboard";
import GenericDashboardView from "../components/Dashboard/GenericDashboardView";
import { useUserData } from "../hook/useUserData";
import { useState, useEffect } from "react";
import { getApprenticeById } from "../Api/Services/Apprentice";

export const Home = () => {
  const { userData, isLoading } = useUserData();
  const [apprenticeId, setApprenticeId] = useState<number | undefined>(undefined);
  const [loadingApprentice, setLoadingApprentice] = useState(false);

  const getUserName = () => {
    if (userData?.email) {
      const emailPart = userData.email.split("@")[0];
      const nameParts = emailPart.split(".");
      return nameParts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
    return "Usuario";
  };

  // Get apprentice_id from person_id
  useEffect(() => {
    const fetchApprenticeId = async () => {
      if (userData?.person && userData?.role === 2) {
        setLoadingApprentice(true);
        try {
          const apprentice = await getApprenticeById(userData.person);
          if (apprentice) {
            setApprenticeId(apprentice.id);
            console.log("Apprentice ID encontrado:", apprentice.id);
          }
        } catch (error) {
          console.error("Error al obtener aprendiz ID:", error);
        } finally {
          setLoadingApprentice(false);
        }
      }
    };

    fetchApprenticeId();
  }, [userData]);

  if (isLoading || loadingApprentice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Role mapping
  // 1: admin, 2: aprendiz, 3: instructor, 4: coordinator
  const roleMap: Record<string | number, "admin" | "coordinator" | "instructor" | "aprendiz"> = {
    1: "admin",
    2: "aprendiz",
    3: "instructor",
    4: "coordinator",
    "admin": "admin",
    "aprendiz": "aprendiz",
    "instructor": "instructor",
    "coordinator": "coordinator"
  };

  const roleRaw = userData?.role;
  const role = roleMap[roleRaw] || null;

  // Render view according to role
  if (role === "admin") {
    return <AdminDashboardView />;
  }
  if (role === "aprendiz") {
    return <ApprenticeDashboardView name={getUserName()} apprenticeId={apprenticeId} />;
  }
  if (role === "instructor") {
    return <InstructorDashboard />;
  }
  if (role === "coordinator") {
    // If you have a specific view for coordinator, put it here
    // return <CoordinatorDashboardView nombre={getUserName()} />;
    return <AdminDashboardView/>;
  }

  // Generic view for unrecognized roles
  return <GenericDashboardView name={getUserName()} />;
};

export default Home;
