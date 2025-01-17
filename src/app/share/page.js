'use client';
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BiCopyAlt, BiLogoWhatsapp, BiMobile, BiPencil } from "react-icons/bi";
import EditTemplateModal from "./EditTemplateModal";

// Helper function to check localStorage support
const isLocalStorageSupported = () => {
    try {
        const testKey = "__test__";
        localStorage.setItem(testKey, "1");
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
};

const allowedDomains = [
    'sewaundangan.com',
    'bukaundangan.com',
    'buka.undanganku.store',
    'undanganku.store'
];

const isValidDomain = (url) => {
    try {
        const { hostname } = new URL(url);
        return allowedDomains.some(domain => hostname.endsWith(domain));
    } catch (error) {
        return false;
    }
};

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

export default function Share() {
    const defaultTemplate = `Kepada Yth.
Bapak/Ibu/Saudara/i
{{nama_tamu}}
__________________________________________
Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i, teman sekaligus sahabat, untuk menghadiri acara pernikahan kami.

Berikut link undangan kami, untuk info lengkap dari acara, bisa kunjungi:

{{link}}

Hasil maksimal buka lewat browser chrome/safari.

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

Terima Kasih`;

    const [template, setTemplate] = useState(defaultTemplate);
    const [isTemplateEdited, setIsTemplateEdited] = useState(false);
    const [namaTamu, setNamaTamu] = useState('');
    const [link, setLink] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [supportsLocalStorage, setSupportsLocalStorage] = useState(false);
    const [linkError, setLinkError] = useState('');

    useEffect(() => {
        // Check if localStorage is supported
        const supported = isLocalStorageSupported();
        setSupportsLocalStorage(supported);

        if (supported) {
            const savedTemplate = localStorage.getItem('template');
            if (savedTemplate) {
                setTemplate(savedTemplate);
            }
        }
    }, []);

    const handleTemplateChange = (e) => {
        setTemplate(e.target.value);
        if (supportsLocalStorage) {
            const savedTemplate = localStorage.getItem('template') || defaultTemplate;
            setIsTemplateEdited(e.target.value !== savedTemplate);
        } else {
            setIsTemplateEdited(e.target.value !== defaultTemplate);
        }
    };

    const handleNamaTamuChange = (e) => {
        const value = e.target.value;
        setNamaTamu(value);

        // Update link dynamically with ?to=nama_tamu
        try {
            const url = new URL(link || 'https://example.com'); // Use a placeholder URL if link is empty
            if (value) {
                url.searchParams.set('to', encodeURIComponent(value));
            } else {
                url.searchParams.delete('to');
            }
            setLink(url.toString());
        } catch (error) {
            console.error('Invalid link format:', error);
        }
    };

    const validateLink = (value) => {
        if (isValidDomain(value)) {
            setLink(value);
            setLinkError('');
        } else {
            setLink(''); // Clear link if invalid
            setLinkError('Link Undangan tidak valid. Harus menggunakan salah satu domain yang diizinkan.');
        }
    };

    const debouncedValidateLink = debounce(validateLink, 1000);

    const handleLinkChange = (e) => {
        const value = e.target.value;
        setLink(value);
        debouncedValidateLink(value);
    };

    const handleSaveTemplate = () => {
        if (supportsLocalStorage) {
            localStorage.setItem('template', template);
            alert("Template telah disimpan!");
        } else {
            alert("Browser Anda tidak mendukung penyimpanan template.");
        }
        setIsTemplateEdited(false);
        setIsDialogOpen(false); // Close modal after saving
    };

    const handleCopyText = () => {
        const dynamicTemplate = template
            .replace(/{{nama_tamu}}/g, namaTamu || '...')
            .replace(/{{link}}/g, link || '...');
        navigator.clipboard.writeText(dynamicTemplate)
            .then(() => alert("Teks telah berhasil disalin"))
            .catch((err) => console.error("Gagal menyalin teks: ", err));
    };

    const handleShare = async () => {
        const dynamicTemplate = template
            .replace(/{{nama_tamu}}/g, namaTamu || '...')
            .replace(/{{link}}/g, link || '...');
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Undangan Pernikahan',
                    text: dynamicTemplate,
                    url: link,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            alert('Web Share API tidak didukung di browser Anda.');
        }
    };

    const renderedTemplate = template
        .replace(/{{nama_tamu}}/g, namaTamu || '...')
        .replace(/{{link}}/g, link || '...');

    return (
        <>
            <div className="flex flex-col space-y-5 justify-center items-center mx-4">
                <div className="w-full sm:max-w-[20rem] space-y-2 my-4 flex flex-col items-center">
                    <Input
                        type="url"
                        placeholder="Link Undangan"
                        className={`w-full border px-2 rounded ${linkError ? 'border-red-500' : ''}`}
                        value={link}
                        onChange={handleLinkChange}
                    />
                    {linkError && <p className="text-red-500 text-sm">{linkError}</p>}
                    <Input
                        type="text"
                        placeholder="Nama Tamu"
                        className="w-full border p-2 rounded"
                        value={namaTamu}
                        onChange={handleNamaTamuChange}
                    />
                    <div className="w-full flex justify-end">
                        <Button
                            className="bg-yellow-500 border text-sm px-2 py-1"
                            onClick={() => setIsDialogOpen(true)}
                        >
                            <BiPencil className="inline-block mr-2" /> Edit Template
                        </Button>
                    </div>
                    <Textarea
                        value={renderedTemplate}
                        className="h-96 border-dashed"
                        readOnly
                        placeholder="Preview undangan akan muncul di sini"
                    />
                    <div className="flex space-x-2 w-full">
                        <Button onClick={handleCopyText} className="w-full">
                            <BiCopyAlt className="inline-block mr-2 text-lg" />Copy Text
                        </Button>
                        <Button className="w-full bg-green-500">
                            <a href={`https://api.whatsapp.com/send?phone=&text=${encodeURIComponent(renderedTemplate)}`} target="_blank" rel="noopener noreferrer">
                                <BiLogoWhatsapp className="inline-block mr-2 text-lg" />Share To WA
                            </a>
                        </Button>
                    </div>
                    <Button onClick={handleShare} className="w-full bg-blue-700 border">
                        <BiMobile className="inline-block mr-2 text-lg" /> Share To Other App
                    </Button>
                </div>
            </div>

            <EditTemplateModal
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                template={template}
                onTemplateChange={handleTemplateChange}
                onSaveTemplate={handleSaveTemplate}
            />
        </>
    );
}