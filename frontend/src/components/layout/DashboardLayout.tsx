import React from "react";
import { Sidebar } from "./Sidebar";


interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {

    return (
        <div className="flex min-h-svh">
            <Sidebar />
            <div className="flex flex-col flex-1">
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}