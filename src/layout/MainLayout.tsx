/**
 * MainLayout component
 * Main application structure with sidebar menu, header, content, and footer.
 *
 * Features:
 * - Shows sidebar menu with user data.
 * - Includes header, main area (Outlet), and footer.
 * - Shows loading screen while fetching user data.
 * - Synchronizes profile image from database.
 *
 * @returns JSX.Element Main layout rendered.
 */

import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/MainLayout/Header";
import Menu from "../components/MainLayout/Menu";
import Footer from "../components/MainLayout/Footer";
import { useUserData } from "../hook/useUserData";
import { getPersonById } from "../Api/Services/Person";
import { Person } from "../Api/types/entities/person.types";

export default function MainLayout() {
  const { userData, isLoading } = useUserData();
  const [activeModule, setActiveModule] = useState<string>("");
  const [activeFormName, setActiveFormName] = useState<string>("");
  const [personData, setPersonData] = useState<Person | null>(null);

  // Get person data to display profile image
  useEffect(() => {
    if (userData?.person) {
      getPersonById(userData.person)
        .then(setPersonData)
        .catch((err) => console.error("Error cargando datos de persona:", err));
    }
  }, [userData?.person]);

  // Listen for profile image update events
  useEffect(() => {
    const handleImageUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.image !== undefined) {
        setPersonData((prev) => prev ? { ...prev, image: customEvent.detail.image } : null);
      }
    };

    window.addEventListener('profileImageUpdated', handleImageUpdate);
    return () => {
      window.removeEventListener('profileImageUpdated', handleImageUpdate);
    };
  }, []);

  // Function to get user name
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

  // Receives menu click and updates breadcrumb
  const handleMenuItemClick = (form) => {
    setActiveModule(form.moduleName); // Make sure the form object has moduleName
    setActiveFormName(form.name);
  };

  if (isLoading) {
    // 👇 while loading, shows a simple loading screen
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  // Layout: desktop (md+) = grid: header arriba, menú izq, contenido der, footer abajo
  // mobile (sm) = header fijo arriba, menú modal, contenido debajo, footer fijo
  return (
    <div className="min-h-screen w-full bg-[#D9D9D9] md:grid md:grid-cols-[auto_1fr] md:grid-rows-[auto_1fr_auto] md:h-screen flex flex-col">
      {/* Menú lateral: col 1, row 1-3 en desktop, modal en móvil */}
      <aside className="hidden md:block col-start-1 col-end-2 row-start-1 row-end-4 h-full">
        <Menu
          className="h-full flex-shrink-0 "
          userId={userData!.id}
          userName={getUserName()}
          userImage={personData?.image}
          onMenuItemClick={handleMenuItemClick}
        />
      </aside>
      {/* Header: sólo en columna de contenido en desktop, fijo arriba en móvil */}
      <header className="z-30 md:col-start-2 md:col-end-3 md:row-start-1 md:row-end-2 w-full md:static fixed top-0 left-0">
        <Header moduleName={activeModule} formName={activeFormName} />
      </header>
      {/* Contenido principal: col 2, row 2 en desktop; debajo del header en móvil */}
      <main className="md:col-start-2 md:col-end-3 md:row-start-2 md:row-end-3 flex flex-col w-full min-h-0 p-2 md:p-4">
        <Outlet />
      </main>
      {/* Footer: sólo en columna de contenido en desktop, fijo abajo en móvil */}
      <footer className="md:col-start-2 md:col-end-3 md:row-start-3 md:row-end-4 w-full md:static fixed bottom-0 left-0 z-20">
        <Footer />
      </footer>
      {/* Menú hamburguesa modal en móvil (Menu ya lo gestiona como modal) */}
      <div className="md:hidden block">
        <Menu
          className="h-screen flex-shrink-0 fixed top-0 left-0 z-[101]"
          userId={userData!.id}
          userName={getUserName()}
          userImage={personData?.image}
          onMenuItemClick={handleMenuItemClick}
        />
      </div>
    </div>
  );
}
