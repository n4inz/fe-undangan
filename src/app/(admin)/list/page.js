'use client';
import Sidebar from "@/layout/sidebar";

const Dashboard = () => {


    return (
        <>
            <div className="h-10 fixed z-50 bg-white border-b w-full"></div>
            <div className="flex min-h-screen pt-10">
                {/* Sidebar */}
                <div className="fixed md:relative z-40 w-64 h-full bg-gray-800 md:block hidden">
                    <Sidebar />
                </div>
                
                {/* Main Content */}
                <div className="flex flex-col flex-grow w-full md:pl-24">
                    <div className="p-4">
                        List
                    </div>
                </div>
            </div>
        </>
    );


}

export default Dashboard;