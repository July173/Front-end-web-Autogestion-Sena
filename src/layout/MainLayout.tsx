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

  // 👇 now the layout always returns the structure
  return (
    <div className="flex h-screen overflow-hidden w-full bg-[#D9D9D9]">
      <Menu
        className="h-screen flex-shrink-0 "
        userId={userData!.id}
        userName={getUserName()}
        userImage={personData?.image}
        onMenuItemClick={handleMenuItemClick}
      />
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="sticky top-0 z-30">
          <Header moduleName={activeModule} formName={activeFormName} />
        </div>

        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
