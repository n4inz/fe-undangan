'use client';
import React, { useState } from "react";
import { useSearchParams } from "next/navigation"; // Import Next.js hook for getting search params
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FaMobile } from "react-icons/fa";

export default function Share() {
    const searchParams = useSearchParams();
    const initialUri = searchParams.get('uri') || ''; // Get the 'uri' from the search params

    const [formData, setFormData] = useState({
        link: initialUri, // Initialize link with uri from searchParams
        namaTamu: '',
        template: '',
        valid: 1
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        let encodedNamaTamu;
        let updatedLink = formData.link;
        let text = formData.template;

        if (name === 'namaTamu') {
            encodedNamaTamu = encodeURIComponent(value);
            try {
                const url = new URL(updatedLink);
                if (
                    url.origin === 'https://invitation-wedding-dreams.sewaundangan.store' ||
                    url.origin === 'https://buka.undanganku.store' ||
                    url.origin === 'https://sewaundangan.com' ||
                    url.origin === 'https://invitation-wedding-dreams.sewaundangan.com'
                ) {
                    updatedLink = `${url.origin}${url.pathname}?to=${encodedNamaTamu}`;
                    text = `Kepada Yth.\nBapak/Ibu/Saudara/i\n${value}\n__________________________________________\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i, teman sekaligus sahabat, untuk menghadiri acara pernikahan kami\n\nBerikut link undangan kami, untuk info lengkap dari acara, bisa kunjungi:\n\n${updatedLink}\n\nHasil maksimal buka lewat browser chrome/safari\n\nMerupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.\n\nTerima Kasih`;
                } else {
                    setFormData({
                        ...formData,
                        valid: 0,
                    });
                    return;
                }
            } catch (error) {
                console.log('Ini bukan link');
            }
        }

        setFormData({
            ...formData,
            [name]: value,
            template: text,
            link: name === 'link' ? value : updatedLink,
            valid: name === 'link' ? 1 : formData.valid,
        });
    };

    const handleTextareaChange = (e) => {
        setFormData({
            ...formData,
            template: e.target.value // Update the template when the textarea is edited
        });
    };

    const handleCopyText = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(formData.template)
                .then(() => {
                    alert("Teks telah berhasil disalin");
                })
                .catch((err) => {
                    console.error("Gagal menyalin teks: ", err);
                });
        } else {
            // Fallback for browsers that do not support navigator.clipboard
            const textarea = document.createElement('textarea');
            textarea.value = formData.template;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                alert("Teks telah berhasil disalin");
            } catch (err) {
                console.error('Gagal menyalin teks dengan fallback:', err);
            }
            document.body.removeChild(textarea);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            const shareData = {
                title: 'Undangan Pernikahan',
                text: formData.template, // Include the invitation text
                url: formData.link // Include the invitation URL
            };

            try {
                await navigator.share(shareData);
                console.log('Shared successfully');
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            alert('Web Share API tidak didukung di browser Anda. Silakan salin tautan secara manual.');
            // Optionally, you could provide a fallback UI to copy the link manually.
        }
    };


    return (
        <>
            <div className="flex flex-col space-y-5 justify-center items-center mx-4">
                <div className="w-full sm:max-w-[20rem] space-y-2 my-4 flex flex-col items-center">
                    <Input
                        className="outline-none focus:ring-0"
                        placeholder="Link Undangan"
                        name="link"
                        value={formData.link}
                        onChange={handleChange}
                    />
                    <Input
                        className="outline-none focus:ring-0"
                        placeholder="Nama Tamu"
                        name="namaTamu"
                        value={formData.namaTamu}
                        onChange={handleChange}
                    />
                    {formData.valid ? (
                        <Textarea
                            value={formData.template}
                            className="h-96"
                            onChange={handleTextareaChange} // Make textarea editable
                            placeholder="Kepada YTH......"
                        />
                    ) : (
                        'URL tidak valid'
                    )}
                    <div className="flex space-x-2 w-full">
                        <Button onClick={handleCopyText} className="w-full">Copy Text</Button>
                        <Button className="w-full bg-green-500">
                            <a href={`https://api.whatsapp.com/send?phone=&text=${encodeURIComponent(formData.template)}`} target="_blank" rel="noopener noreferrer">
                                Share To WA
                            </a>
                        </Button>
                    </div>
                    {/* Share to Other Apps using Web Share API */}
                    <Button onClick={handleShare} className="w-full bg-blue-700 border">
                        Share To Other App <FaMobile className="ml-2" />
                    </Button>

                </div>
            </div>
        </>
    );
}
