"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { redirect, usePathname, useRouter } from "next/navigation";
import { SlHome } from "react-icons/sl";
import { FaListUl, FaClipboardList } from "react-icons/fa";
import { BiLogOut, BiUser, BiMoney, BiHeartSquare, BiImages, BiSolidMusic, BiUserPlus, BiUserCircle, BiCog, BiImage, BiChat, BiFolder } from "react-icons/bi";
import Image from "next/image";

import logo from "../../../public/logo/Sewa.png";
import axios from "axios";
import Cookies from "js-cookie";
import { signOut } from "next-auth/react";
import { getCompanyProfile } from "@/lib/company";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function Sidebar({ authenticated, className, mobileOpen, desktopCollapsed, onMobileClose }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(0);
    const [company, setCompany] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [isFileManagerOpen, setFileManagerOpen] = useState(false);
    const [isAffiliateOpen, setAffiliateOpen] = useState(false);
    const [isListOpen, setListOpen] = useState(false);

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

    useEffect(() => {
        if (pathname?.startsWith("/admin/list")) {
            setListOpen(true);
        }
    }, [pathname]);

    const logoUrl = company?.logo
        ? `${process.env.NEXT_PUBLIC_API_URL}/asset/${company.logo}`
        : null;

    // Clickable menu items
    const MenuItem = ({ icon, name, route, onClick }) => {
        const isActive = route === "/admin/list"
            ? pathname === route
            : pathname?.startsWith(route);
        const colorClass = isActive ? "font-medium text-blue-700" : "text-[#0F2542] hover:text-[#A6A6A6]";
        return (
            <Link
                href={route !== "#logout" ? route : "#"}
                onClick={(event) => {
                    onMobileClose?.();
                    onClick?.(event);
                }}
                aria-current={isActive ? "page" : undefined}
                className={`flex gap-1 [&>*]:my-auto text-sm pl-6 py-3 border-b-[1px] border-b-white/10 ${colorClass}`}
            >
                <div className="text-xl flex [&>*]:mx-auto w-[30px]">
                    {icon}
                </div>
                <div>{name}</div>
            </Link>
        );
    };

    const handleLogout = async () => {
        try {
            await axios.get(process.env.NEXT_PUBLIC_API_URL + "/logout", { withCredentials: true });
            Cookies.remove('client_token');
            await signOut({ redirect: false });
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
            <aside
                id="admin-sidebar"
                aria-label="Navigasi admin"
                className={className}
                data-mobile-open={mobileOpen}
                data-desktop-collapsed={desktopCollapsed}
            >
                <div className="shrink-0 p-4 flex items-center justify-center">
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
                <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
                    {isAdmin === 1 && (
                        <MenuItem name="Dashboard" route="/admin/dashboard" icon={<SlHome />} />
                    )}
                    <Collapsible open={isListOpen} onOpenChange={setListOpen} className="pl-3">
                        <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted rounded-md">
                            <div className="flex items-center gap-2">
                                <FaListUl className="text-lg" />
                                <span>List</span>
                            </div>
                            <ChevronDown className={`transition-transform ${isListOpen ? "rotate-180" : ""}`} size={16} />
                        </CollapsibleTrigger>

                        <CollapsibleContent className="ml-6 mt-1 space-y-1">
                            <MenuItem name="Form Wedding" route="/admin/list" icon={<BiHeartSquare />} />
                            <MenuItem name="Form Aqiqah / Khitan" route="/admin/list/aqiqah-khitan" icon={<FaClipboardList />} />
                        </CollapsibleContent>
                    </Collapsible>
                    <MenuItem name="MyList" route="/admin/mylist" icon={<FaClipboardList />} />

                    {isAdmin === 1 && (
                        <>
                            <MenuItem name="Staff" route="/admin/staff" icon={<BiUser />} />
                            <MenuItem name="Customer" route="/admin/customer" icon={<BiUserCircle />} />
                            <MenuItem name="Expending" route="/admin/expending" icon={<BiMoney />} />
                            <MenuItem name="Tema" route="/admin/tema" icon={<BiHeartSquare />} />
                            <MenuItem name="Asset" route="/admin/asset" icon={<BiImages />} />
                            <MenuItem name="Musik" route="/admin/music" icon={<BiSolidMusic />} />
                            <MenuItem name="Quote" route="/admin/quotes" icon={<BiChat />} />
                            {/* Affiliate Management Group */}
                            <Collapsible open={isAffiliateOpen} onOpenChange={setAffiliateOpen} className="pl-3">
                                <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted rounded-md">
                                    <div className="flex items-center gap-2">
                                        <BiUserPlus className="text-lg" />
                                        <span>Affiliate</span>
                                    </div>
                                    <ChevronDown className={`transition-transform ${isAffiliateOpen ? "rotate-180" : ""}`} size={16} />
                                </CollapsibleTrigger>

                                <CollapsibleContent className="ml-6 mt-1 space-y-1">
                                    <MenuItem name="Komisi" route="/admin/referral" icon={<BiUserPlus />} />
                                    <MenuItem name="Penarikan" route="/admin/withdrawal" icon={<BiMoney />} />
                                </CollapsibleContent>
                            </Collapsible>
                            {/* File Manager Group */}
                            <Collapsible open={isFileManagerOpen} onOpenChange={setFileManagerOpen} className="pl-3">
                                <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted rounded-md">
                                    <div className="flex items-center gap-2">
                                        <BiFolder className="text-lg" />
                                        <span>File Manager</span>
                                    </div>
                                    <ChevronDown className={`transition-transform ${isFileManagerOpen ? "rotate-180" : ""}`} size={16} />
                                </CollapsibleTrigger>

                                <CollapsibleContent className="ml-6 mt-1 space-y-1">
                                    <MenuItem name="Gallery" route="/admin/gallery" icon={<BiImage />} />
                                </CollapsibleContent>
                            </Collapsible>

                            <MenuItem name="Setting" route="/admin/setting" icon={<BiCog />} />
                        </>
                    )}

                    <MenuItem name="Logout" route="#logout" icon={<BiLogOut />} onClick={handleLogout} />

                </nav>
            </aside>
    );
}
