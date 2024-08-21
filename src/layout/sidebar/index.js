import { useState } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { SlHome } from 'react-icons/sl'
import { FaListUl, FaClipboardList } from 'react-icons/fa'
import { BiLogOut } from "react-icons/bi";
import Image from 'next/image'

import logo from '../../../public/logo/Sewa.png'
import axios from 'axios';

export default function Sidebar({ show, setter }) {
    const router = useRouter();


    // Define our base class
    const className = "pt-10 bg-white w-[300px] transition-[margin-left] ease-in-out duration-500 top-0 bottom-0 left-0 z-40 border-r fixed";
    // Append class based on state of sidebar visibility
    const appendClass = show ? " ml-0" : " ml-[-250px] md:ml-0";

    // Clickable menu items
    const MenuItem = ({ icon, name, route, onClick }) => {
        // Highlight menu item based on currently displayed route
        const colorClass = router.pathname === route ? "text-white" : "text-[#0F2542] hover:text-[#A6A6A6]";

        return (
            <Link
                href={route !== "#logout" ? route : "#"}
                onClick={onClick}
                className={`flex gap-1 [&>*]:my-auto text-sm pl-6 py-3 border-b-[1px] border-b-white/10 ${colorClass}`}
            >
                <div className="text-xl flex [&>*]:mx-auto w-[30px] ">
                    {icon}
                </div>
                <div>{name}</div>
            </Link>
        )
    }

    // Overlay to prevent clicks in background, also serves as our close button
    const ModalOverlay = () => (
        <div
            className={`flex md:hidden top-0 right-0 bottom-0 left-0 bg-black/50 z-30`}
            onClick={() => {
                setter(oldVal => !oldVal);
            }}
        />
    )

    const handleLogout = async () => {
        // setActive(true)
        try {
          await axios.get(process.env.NEXT_PUBLIC_API_URL + '/logout', { withCredentials: true });
          router.push('/login'); // Adjust the URL as needed
        } catch (error) {
          console.error("Logout failed:", error);
          setActive(false)
        }
      };

    return (
        <>
            <div className={`${className}${appendClass}`}>
                <div className="p-2 flex items-center justify-center ">
                    <Link href="/dashboard">
                        {/*eslint-disable-next-line*/}
                        <Image 
                            className='rounded-full'
                            src={logo.src}
                            alt="Company Logo"
                            width={100} height={100}
                        />
                    </Link>
                </div>
                <div className="flex flex-col ">
                    <MenuItem
                        name="Dashboard"
                        route="/admin/dashboard"
                        icon={<SlHome />}
                    />
                    <MenuItem
                        name="List"
                        route="/admin/list"
                        icon={<FaListUl />}
                    />
                    <MenuItem
                        name="MyList"
                        route="/admin/mylist"
                        icon={<FaClipboardList />}
                    />
                    <MenuItem
                        name="Logout"
                        route="#logout"
                        icon={<BiLogOut />}
                        onClick={handleLogout}
                    />  
                </div>
            </div>
            {show ? <ModalOverlay /> : <></>}
        </>
    )
}
