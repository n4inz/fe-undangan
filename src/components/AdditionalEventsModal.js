import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BiX } from "react-icons/bi";

const AdditionalEventsModal = ({
    isOpen,
    onClose,
    weddingEvents,
    handleAddEvent,
    handleRemoveEvent,
    handleEventChange,
    readOnly = false
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95%] rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold border-b pb-2">Acara Tambahan</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                    {!readOnly && (
                        <p className="text-sm text-gray-500 italic">
                            Gunakan fitur ini untuk menambah acara lain seperti Pengajian, Siraman, Unduh Mantu, dll.
                        </p>
                    )}

                    {/* mulai penomoran dari sini */}
                    {(() => {
                        const startNumber = 3; // ubah angka ini jika mau mulai dari nomor lain
                        return weddingEvents.map((event, index) => {
                            const displayNumber = startNumber + index;
                            return (
                                <div key={index} className="p-4 border border-gray-200 rounded-xl relative bg-gray-50/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-blue-700 flex items-center gap-2">
                                            Acara {displayNumber}
                                        </h3>
                                        {weddingEvents.length > 1 && !readOnly && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleRemoveEvent(index)}
                                            >
                                                <BiX className="h-6 w-6" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <Label className="text-xs font-semibold uppercase text-gray-500">Judul Acara {displayNumber}</Label>
                                            <Input
                                                placeholder="Contoh: Pengajian / Siraman / Unduh Mantu"
                                                value={event.nama}
                                                onChange={(e) => !readOnly && handleEventChange(index, 'nama', e.target.value)}
                                                className="bg-white"
                                                disabled={readOnly}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs font-semibold uppercase text-gray-500">Tanggal Acara</Label>
                                                <Input
                                                    type="date"
                                                    value={event.tanggal}
                                                    onChange={(e) => !readOnly && handleEventChange(index, 'tanggal', e.target.value)}
                                                    className="bg-white"
                                                    disabled={readOnly}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold uppercase text-gray-500">Waktu Acara</Label>
                                                <Input
                                                    placeholder="Contoh: 09.00 - Selesai"
                                                    value={event.waktu}
                                                    onChange={(e) => !readOnly && handleEventChange(index, 'waktu', e.target.value)}
                                                    className="bg-white"
                                                    disabled={readOnly}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold uppercase text-gray-500">Tempat Acara</Label>
                                            <Input
                                                placeholder="Contoh: Rumah Mempelai Wanita / Gedung Serbaguna"
                                                value={event.tempat}
                                                onChange={(e) => !readOnly && handleEventChange(index, 'tempat', e.target.value)}
                                                className="bg-white"
                                                disabled={readOnly}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs font-semibold uppercase text-gray-500">Alamat Lengkap</Label>
                                            <Textarea
                                                placeholder="Sebutkan alamat lengkap lokasi acara..."
                                                value={event.alamat}
                                                onChange={(e) => !readOnly && handleEventChange(index, 'alamat', e.target.value)}
                                                className="bg-white min-h-[80px]"
                                                disabled={readOnly}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        });
                    })()}

                    <div className="flex flex-col gap-3 pt-2">
                        {weddingEvents.length < 4 && !readOnly && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 py-6 font-medium"
                                onClick={handleAddEvent}
                            >
                                + Tambah Baris Acara ({weddingEvents.length}/4)
                            </Button>
                        )}

                        <Button
                            type="button"
                            className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg font-bold shadow-lg shadow-blue-200"
                            onClick={() => onClose(false)}
                        >
                            {readOnly ? 'Tutup' : 'Simpan & Tutup'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AdditionalEventsModal;
