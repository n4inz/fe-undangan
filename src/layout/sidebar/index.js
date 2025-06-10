"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { SlHome } from "react-icons/sl";
import { FaListUl, FaClipboardList } from "react-icons/fa";
import { BiLogOut, BiUser, BiMenu, BiMoney, BiHeartSquare, BiImages, BiSolidMusic, BiUserPlus, BiUserCircle, BiCog, BiX } from "react-icons/bi";
import Image from "next/image";

import logo from "../../../public/logo/Sewa.png";
import axios from "axios";
import Cookies from "js-cookie";
import { getCompanyProfile } from "@/lib/company";

export default function Sidebar({ authenticated }) {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to handle sidebar visibility
    const [company, setCompany] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    if (!authenticated) {
        redirect("/login");
    }
    const fetchUserStatus = async () => {
        try {
            const res = await axios.get(process.env.NEXT_PUBLIC_API_URL + "/cek-role", {
                withCredentials: true,
            });
            setIsAdmin(res.data.isAdmin);
        } catch (error) {
            console.error("Error fetching user status", error);
            Cookies.remove("client_token");
            router.push("/login");
        }
    };

    const fetchProfile = async () => {
        setProfileLoading(true);
        // setError(null);
        try {
            const data = await getCompanyProfile();
            setCompany(data.data);
        } catch (err) {
            // setError('Failed to load company profile');
            setCompany(null);
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        fetchUserStatus();
        fetchProfile();

        // console.log("CHECK: " + authenticated);
    }, []);

    const logoUrl = company?.logo
        ? `${process.env.NEXT_PUBLIC_API_URL}/asset/${company.logo}`
        : null;

    // Define base class for sidebar
    const className =
        "pt-10 bg-white w-[300px] transition-transform ease-in-out duration-500 top-0 bottom-0 left-0 z-40 border-r fixed";
    // Append class based on sidebar visibility state
    const appendClass = isSidebarOpen ? " translate-x-0" : " -translate-x-full xl:translate-x-0";

    // Clickable menu items
    const MenuItem = ({ icon, name, route, onClick }) => {
        const colorClass = router.pathname === route ? "text-white" : "text-[#0F2542] hover:text-[#A6A6A6]";
        return (
            <Link
                href={route !== "#logout" ? route : "#"}
                onClick={onClick}
                className={`flex gap-1 [&>*]:my-auto text-sm pl-6 py-3 border-b-[1px] border-b-white/10 ${colorClass}`}
            >
                <div className="text-xl flex [&>*]:mx-auto w-[30px]">
                    {icon}
                </div>
                <div>{name}</div>
            </Link>
        );
    };

    // Overlay to prevent background clicks, also serves as close button for mobile
    const ModalOverlay = () => (
        <div
            className={`fixed xl:hidden top-0 right-0 bottom-0 left-0 bg-black/50 z-30`}
            onClick={() => {
                setIsSidebarOpen(false); // Close the sidebar when clicking outside
            }}
        />
    );

    const handleLogout = async () => {
        try {
            await axios.get(process.env.NEXT_PUBLIC_API_URL + "/logout", { withCredentials: true });
            Cookies.remove('client_token');
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <>
            {/* Mobile toggle button */}
            <div className="xl:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="text-3xl text-black p-2"
                >
                    {isSidebarOpen ? <BiX /> : <BiMenu />}
                </button>
            </div>

            {/* Sidebar */}
            <div className={`${className}${appendClass}`}>
                <div className="p-2 flex items-center justify-center">
                    <Link href="#">
                        {profileLoading ? (
                            <div className="animate-pulse bg-gray-200 rounded-full w-24 h-24"></div>
                        ) : company && company.logo ? (
                            <Image
                                className="rounded-full"
                                src={logoUrl}
                                alt="Company Logo"
                                width={100}
                                height={100}
                            />
                        ) : (
                            <Image
                                className="rounded-full"
                                src={logo.src}
                                alt="Default Logo"
                                width={100}
                                height={100}
                            />
                        )}
                    </Link>
                </div>
                {/* Scrollable menu items */}
                <div className="flex flex-col overflow-y-auto max-h-[calc(100vh-150px)] pb-4">
                    {isAdmin === 1 &&
                        <MenuItem name="Dashboard" route="/admin/dashboard" icon={<SlHome />} />
                    }
                    <MenuItem name="List" route="/admin/list" icon={<FaListUl />} />
                    <MenuItem name="MyList" route="/admin/mylist" icon={<FaClipboardList />} />
                    {isAdmin === 1 &&
                        <>
                            <MenuItem name="Staff" route="/admin/staff" icon={<BiUser />} />
                            <MenuItem name="Customer" route="/admin/customer" icon={<BiUserCircle />} />
                            <MenuItem name="Expending" route="/admin/expending" icon={<BiMoney />} />
                            <MenuItem name="Tema" route="/admin/tema" icon={<BiHeartSquare />} />
                            <MenuItem name="Asset" route="/admin/asset" icon={<BiImages />} />
                            <MenuItem name="Musik" route="/admin/music" icon={<BiSolidMusic />} />
                            <MenuItem name="Setting" route="/admin/setting" icon={<BiCog />} />
                        </>
                    }
                    <MenuItem name="Logout" route="#logout" icon={<BiLogOut />} onClick={handleLogout} />
                </div>
            </div>

            {/* Overlay for mobile when the sidebar is open */}
            {isSidebarOpen && <ModalOverlay />}
        </>
    );
}
