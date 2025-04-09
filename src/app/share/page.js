'use client';
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BiCopyAlt, BiLogoWhatsapp, BiMobile, BiPencil, BiPaste } from "react-icons/bi";
import EditTemplateModal from "./EditTemplateModal";
import { useSearchParams } from "next/navigation";

const isLocalStorageSupported = () => {
    try {
        localStorage.setItem("__test__", "1");
        localStorage.removeItem("__test__");
        return true;
    } catch {
        return false;
    }
};

const allowedDomains = ['sewaundangan.com', 'bukaundangan.com', 'buka.undanganku.store', 'undanganku.store'];

const isValidDomain = (url) => {
    try {
        return allowedDomains.some(domain => new URL(url).hostname.endsWith(domain));
    } catch {
        return false;
    }
};

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
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

    const searchParams = useSearchParams();
    const initialUri = searchParams.get('uri') || ''; // Get the 'uri' from the search params

    const [template, setTemplate] = useState(defaultTemplate);
    const [isTemplateEdited, setIsTemplateEdited] = useState(false);
    const [namaTamu, setNamaTamu] = useState('');
    const [link, setLink] = useState(initialUri);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [supportsLocalStorage, setSupportsLocalStorage] = useState(false);
    const [linkError, setLinkError] = useState('');

    const handleTemplateChange = (e) => {
        const value = e.target.value;
        setTemplate(value);
        const savedTemplate = supportsLocalStorage ? localStorage.getItem('template') || defaultTemplate : defaultTemplate;
        setIsTemplateEdited(value !== savedTemplate);
    };

    const handleNamaTamuChange = (e) => {
        const value = e.target.value;
        setNamaTamu(value);
        try {
            const url = new URL(link || 'https://example.com');
            if (value) {
                url.searchParams.set('to', value); // Do not use encodeURIComponent here
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
            setLink('');
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
        setIsDialogOpen(false);
    };

    const handleCopyText = () => {
        const dynamicTemplate = template.replace(/{{nama_tamu}}/g, namaTamu || '...').replace(/{{link}}/g, link || '...');
        navigator.clipboard.writeText(dynamicTemplate)
            .then(() => alert("Teks telah berhasil disalin"))
            .catch((err) => console.error("Gagal menyalin teks: ", err));
    };

    const handleShare = async () => {
        const dynamicTemplate = template.replace(/{{nama_tamu}}/g, namaTamu || '...').replace(/{{link}}/g, link || '...');
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

    const handlePasteLink = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setLink(text);
            debouncedValidateLink(text);
        } catch (err) {
            console.error("Failed to read clipboard contents: ", err);
        }
    };

    const renderedTemplate = template.replace(/{{nama_tamu}}/g, namaTamu || '...').replace(/{{link}}/g, link || '...');

    useEffect(() => {
        const supported = isLocalStorageSupported();
        setSupportsLocalStorage(supported);
        if (supported) {
            const savedTemplate = localStorage.getItem('template');
            if (savedTemplate) setTemplate(savedTemplate);
        }
    }, []);

    useEffect(() => {
        if (initialUri && !isValidDomain(initialUri)) {
            setLinkError('Link Undangan tidak valid. Harus menggunakan salah satu domain yang diizinkan.');
            setLink('');
        }
    }, [initialUri]);

    return (
        <>
            <div className="flex flex-col space-y-5 justify-center items-center mx-4">
                <div className="w-full sm:max-w-[20rem] space-y-2 my-4 flex flex-col items-center">
                    <div className="relative w-full flex">
                        <Input
                            type="url"
                            placeholder="Link Undangan"
                            className={`flex-grow border px-2 ${linkError ? 'border-red-500' : ''}`}
                            value={link}
                            onChange={handleLinkChange}
                            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        />
                        <Button
                            className="bg-gray-500 border-l"
                            onClick={handlePasteLink}
                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        >
                            <BiPaste className="inline-block text-lg" />
                        </Button>
                    </div>
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