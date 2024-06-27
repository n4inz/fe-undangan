// 'use client';
// import React, { useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";

// export default function Share() {
//     const [formData, setFormData] = useState({
//         link: '',
//         namaTamu: '',
//         template: '',
//         valid: 1
//     });

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         let encodedNamaTamu;
//         let updatedLink = formData.link;
//         let text = formData.template;

//         if (name === 'namaTamu') {
//             encodedNamaTamu = encodeURIComponent(value);
//             try {
//                 const url = new URL(updatedLink);
//                 if (url.origin === 'https://invitation-wedding-dreams.sewaundangan.store') {
//                     updatedLink = `${url.origin}${url.pathname}?to=${encodedNamaTamu}`;
//                     text = `Kepada Yth.\nBapak/Ibu/Saudara/i\nKELUARGA ${value}\n__________________________________________\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i, teman sekaligus sahabat, untuk menghadiri acara pernikahan kami\n\nBerikut link undangan kami, untuk info lengkap dari acara, bisa kunjungi:\n\n${updatedLink}\n\nHasil maksimal buka lewat browser chrome/safari\n\nMerupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.\n\nTerima Kasih`;
//                 } else {
//                     setFormData({
//                         ...formData,
//                         valid: 0,
//                     });
//                     return;
//                 }
//             } catch (error) {
//                 console.log('Ini bukan link');
//             }
//         }

//         setFormData({
//             ...formData,
//             [name]: value,
//             template: text,
//             link: name === 'link' ? value : updatedLink,
//             valid: name === 'link' ? 1 : formData.valid,
//         });
//     };

//     const handleCopyText = () => {
//         navigator.clipboard.writeText(formData.template).then(() => {
//             alert("Teks telah berhasil disalin");
//         }).catch((err) => {
//             console.error("Gagal menyalin teks: ", err);
//         });
//     };

//     return (
//         <>
//             <div className="flex flex-col space-y-5 justify-center items-center mx-4">
//                 <div className="w-full sm:max-w-[20rem] space-y-2 my-4 flex flex-col items-center">
//                     <Input
//                         className="outline-none focus:ring-0"
//                         placeholder="Link Undangan"
//                         name="link"
//                         onChange={handleChange}
//                     />
//                     <Input
//                         className="outline-none focus:ring-0"
//                         placeholder="Nama Tamu"
//                         name="namaTamu"
//                         onChange={handleChange}
//                     />
//                     {formData.valid ? (
//                         <Textarea value={formData.template} className="h-96" readOnly />
//                     ) : (
//                         'URL tidak valid'
//                     )}
//                     <div className="flex space-x-2 w-full">
//                         <Button onClick={handleCopyText} className="w-full">Copy Text</Button>
//                         <Button className="w-full bg-green-500">
//                             <a href={`https://api.whatsapp.com/send?phone=&text=${encodeURIComponent(formData.template)}`} target="_blank" rel="noopener noreferrer">
//                                 Share To WA
//                             </a>
//                         </Button>
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// }
export default function Share() {

    return (
        <h1>Hello Word</h1>
    )
}