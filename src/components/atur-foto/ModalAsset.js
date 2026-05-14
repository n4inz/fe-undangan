"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Skeleton } from "../ui/skeleton";

const LIMIT = 8;
const INITIAL_SKELETON_COUNT = 8;
const LOAD_MORE_SKELETON_COUNT = 6; // 2 baris pada layout desktop 3 kolom
const MAX_IMAGES = 5; // batas maksimal gambar untuk mode multiple

const ModalAsset = ({
    isOpen,
    onClose,
    onSelectImage,
    selectType = "single",
    partName,
    length = null,
}) => {
    const params = useParams();

    const [assets, setAssets] = useState([]);
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    const scrollContainerRef = useRef(null);
    const loaderRef = useRef(null);

    const loadingRef = useRef(false);
    const pageRef = useRef(1);
    const hasMoreRef = useRef(true);
    const errorTimerRef = useRef(null);
    // Flag untuk mencegah auto-load ganda
    const autoLoadAttemptedRef = useRef(false);

    const resetState = useCallback(() => {
        setAssets([]);
        setSelectedAssets([]);
        setCurrentPage(1);
        setHasMore(true);
        setIsInitialLoading(false);
        setIsLoadingMore(false);
        setErrorMessage(null);
        setFetchError(null);

        loadingRef.current = false;
        pageRef.current = 1;
        hasMoreRef.current = true;
        autoLoadAttemptedRef.current = false;

        if (errorTimerRef.current) {
            clearTimeout(errorTimerRef.current);
            errorTimerRef.current = null;
        }
    }, []);

    const fetchAssets = useCallback(async (page = 1, append = false) => {
        if (loadingRef.current) return;
        if (!hasMoreRef.current && append) return;

        loadingRef.current = true;
        if (append) {
            setIsLoadingMore(true);
        } else {
            setIsInitialLoading(true);
        }
        setFetchError(null);

        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/asset?page=${page}&limit=${LIMIT}`
            );

            const { data = [], total = 0 } = response.data || {};

            setAssets((prev) => (append ? [...prev, ...data] : data));
            setCurrentPage(page);
            pageRef.current = page;

            // hasMore yang benar: jika total tersedia pakai total, jika tidak pakai panjang data
            const nextHasMore = total
                ? page * LIMIT < total
                : data.length === LIMIT;

            setHasMore(nextHasMore);
            hasMoreRef.current = nextHasMore;
        } catch (error) {
            console.error("Error fetching data:", error);
            setFetchError("Gagal memuat aset. Silakan coba lagi.");
        } finally {
            loadingRef.current = false;
            setIsInitialLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    // Reset & initial fetch saat modal dibuka
    useEffect(() => {
        if (!isOpen) {
            resetState();
            return;
        }

        if (assets.length === 0 && !loadingRef.current) {
            fetchAssets(1, false);
        }
    }, [isOpen, resetState, fetchAssets, assets.length]);

    // Observer untuk infinite scroll (depend on assets.length agar terpasang ulang)
    useEffect(() => {
        if (!isOpen) return;
        if (!loaderRef.current || !scrollContainerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting && hasMoreRef.current && !loadingRef.current) {
                    fetchAssets(pageRef.current + 1, true);
                }
            },
            {
                root: scrollContainerRef.current,
                rootMargin: "150px",
                threshold: 0.1,
            }
        );

        observer.observe(loaderRef.current);

        return () => observer.disconnect();
    }, [isOpen, assets.length, fetchAssets]);

    // Auto-load jika konten belum membuat scroll dan masih ada data lebih
    useEffect(() => {
        if (
            isOpen &&
            !isInitialLoading &&
            hasMore &&
            !loadingRef.current &&
            scrollContainerRef.current &&
            !autoLoadAttemptedRef.current
        ) {
            const container = scrollContainerRef.current;
            // Beri sedikit waktu untuk render selesai
            const timer = setTimeout(() => {
                if (
                    container.scrollHeight <= container.clientHeight &&
                    hasMoreRef.current &&
                    !loadingRef.current
                ) {
                    autoLoadAttemptedRef.current = true;
                    fetchAssets(pageRef.current + 1, true);
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isOpen, isInitialLoading, hasMore, assets.length, fetchAssets]);

    const showTemporaryError = useCallback((message) => {
        setErrorMessage(message);
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        errorTimerRef.current = setTimeout(() => {
            setErrorMessage(null);
            errorTimerRef.current = null;
        }, 3000);
    }, []);

    const handleSelect = useCallback(
        (asset) => {
            if (selectType === "multiple") {
                setSelectedAssets((prev) => {
                    const isSelected = prev.some((item) => item.id === asset.id);

                    if (isSelected) {
                        return prev.filter((item) => item.id !== asset.id);
                    }

                    const currentTotal = (length || 0) + prev.length;
                    if (currentTotal >= MAX_IMAGES) {
                        showTemporaryError(`Maksimal ${MAX_IMAGES} gambar`);
                        return prev;
                    }

                    return [...prev, asset];
                });
            } else {
                setSelectedAssets([asset]);
            }
        },
        [selectType, length, showTemporaryError]
    );

    const handleOk = useCallback(async () => {
        if (selectedAssets.length === 0) return;

        if (selectType === "single") {
            const selectedData = selectedAssets.map((asset) => ({
                idAsset: asset.id,
                filename: asset.file,
                imageUrl: `${process.env.NEXT_PUBLIC_API_URL}/asset/${asset.file}`,
            }));
            onSelectImage(selectedData[0]);
        } else {
            const totalSelected = (length || 0) + selectedAssets.length;
            if (totalSelected > MAX_IMAGES) {
                showTemporaryError(`Maksimal ${MAX_IMAGES} gambar`);
                return;
            }

            const selectedData = selectedAssets.map((asset) => ({
                idAsset: asset.id,
                filename: asset.file,
                imageUrl: `${process.env.NEXT_PUBLIC_API_URL}/asset/${asset.file}`,
                partName: partName,
            }));
            onSelectImage(selectedData);
        }

        onClose();
    }, [selectedAssets, selectType, length, partName, onSelectImage, onClose, showTemporaryError]);

    const isSelected = useCallback(
        (assetId) => selectedAssets.some((asset) => asset.id === assetId),
        [selectedAssets]
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Pilih Aset</DialogTitle>
                    <DialogDescription>
                        {selectType === "multiple"
                            ? "Silahkan pilih beberapa gambar untuk ditampilkan di undangan anda."
                            : "Silahkan pilih gambar untuk ditampilkan di undangan anda."}
                    </DialogDescription>
                </DialogHeader>

                {errorMessage && (
                    <div className="text-center text-sm text-red-600 bg-red-50 py-1 rounded">
                        {errorMessage}
                    </div>
                )}

                <div
                    ref={scrollContainerRef}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 p-2"
                >
                    {fetchError && !isInitialLoading && (
                        <p className="col-span-full text-center text-red-500">{fetchError}</p>
                    )}

                    {assets.map((asset) => {
                        const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/asset/${asset.file}`;
                        return (
                            <div
                                key={asset.id}
                                className={`relative text-center border-2 ${isSelected(asset.id)
                                        ? "border-blue-500"
                                        : "border-transparent"
                                    } rounded-lg cursor-pointer p-1`}
                                onClick={() => handleSelect(asset)}
                            >
                                {selectType === "multiple" && isSelected(asset.id) && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                        ✓
                                    </div>
                                )}
                                <Image
                                    src={imageUrl}
                                    alt={asset.name}
                                    width={150}
                                    height={150}
                                    className="rounded-lg w-full h-auto object-cover"
                                    loading="lazy"
                                />
                                <p className="text-sm mt-1">{asset.name}</p>
                            </div>
                        );
                    })}

                    {isInitialLoading &&
                        assets.length === 0 &&
                        Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, index) => (
                            <div key={`initial-skeleton-${index}`} className="flex flex-col gap-2">
                                <Skeleton className="h-[150px] w-full rounded-lg" />
                                <Skeleton className="h-4 w-[80%] mx-auto" />
                            </div>
                        ))}

                    {isLoadingMore &&
                        assets.length > 0 &&
                        Array.from({ length: LOAD_MORE_SKELETON_COUNT }).map((_, index) => (
                            <div key={`more-skeleton-${index}`} className="flex flex-col gap-2">
                                <Skeleton className="h-[150px] w-full rounded-lg" />
                                <Skeleton className="h-4 w-[80%] mx-auto" />
                            </div>
                        ))}

                    {!isInitialLoading && !fetchError && assets.length === 0 && (
                        <p className="text-center col-span-full text-gray-500">
                            Tidak ada aset tersedia
                        </p>
                    )}

                    <div ref={loaderRef} className="col-span-full h-4" />
                </div>

                <div className="flex justify-end items-center gap-4 mt-4">
                    {selectType === "multiple" && (
                        <span className="text-sm text-gray-600">
                            Terpilih: {selectedAssets.length} / {MAX_IMAGES}
                        </span>
                    )}
                    <button
                        onClick={handleOk}
                        disabled={selectedAssets.length === 0}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        OK
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ModalAsset;