import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
    return (
        <div className="min-h-screen bg-bgdark">
            <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Navbar />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-bgdark">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Layout;