import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/navbar';
import Footer from '../components/common/footer';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow py-6">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};

export default MainLayout;