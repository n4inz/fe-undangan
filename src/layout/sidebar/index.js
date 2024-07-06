// @/components/Layout/Sidebar.js
// import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { SlHome } from 'react-icons/sl'
import { FaListUl, FaClipboardList } from 'react-icons/fa'
import { BiLogOut } from "react-icons/bi";


import logo from '../../../public/logo/Sewa.png'

export default function Sidebar({ show, setter }) {
    const router = useRouter();

    // Define our base class
    const className = "pt-10 bg-white w-[300px] transition-[margin-left] ease-in-out duration-500 top-0 bottom-0 left-0 z-40 border-r fixed";
    // Append class based on state of sidebar visiblity
    const appendClass = show ? " ml-0" : " ml-[-250px] md:ml-0";

    // Clickable menu items
    const MenuItem = ({ icon, name, route }) => {
        // Highlight menu item based on currently displayed route
        const colorClass = router.pathname === route ? "text-white" : "text-[#0F2542] hover:text-[#A6A6A6]";

        return (
            <Link
                href={route}
               
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
            className={`flex md:hidden  top-0 right-0 bottom-0 left-0 bg-black/50 z-30`}
            onClick={() => {
                setter(oldVal => !oldVal);
            }}
        />
    )

    return (
        <>
            <div className={`${className}${appendClass}`}>
                <div className="p-2 flex items-center justify-center ">
                    <Link href="/">
                        {/*eslint-disable-next-line*/}
                        <img className='rounded-full' src={logo.src} alt="Company Logo" width={100} height={100} />
                    </Link>
                </div>
                <div className="flex flex-col ">
                    <MenuItem
                        name="Dashboard"
                        route="/dashboard"
                        icon={<SlHome />}
                    />
                    <MenuItem
                        name="List"
                        route="/list"
                        icon={<FaListUl />}
                    />
                    <MenuItem
                        name="MyList"
                        route="/my-list"
                        icon={<FaClipboardList />}
                    />
                    <MenuItem
                        name="Logout"
                        route="/logout"
                        icon={<BiLogOut />}
                    />
                   
                </div>
            </div>
            {show ? <ModalOverlay /> : <></>}
        </>
    )
}