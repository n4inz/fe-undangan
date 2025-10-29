//BACKGROUND
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import axios from "axios";
import { useParams } from "next/navigation";
import placeholder from "/public/images/placeholder.png";
import { BiX } from "react-icons/bi";
import LoadingOverlay from "./LoadingOverlay";
import ModalAsset from "./ModalAsset";
import { FaImages } from "react-icons/fa";
import { toast } from "../ui/use-toast";

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle } from "lucide-react";

// Sortable item component
const SortableItem = ({ item, onRemove, uploading, remove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id || item.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative w-full p-1"
    >
      <div className="aspect-square overflow-hidden rounded-lg">
        <img
          src={item.url}
          alt="Preview"
          className="w-full h-full object-cover touch-none"
          draggable="false"
        />
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id, item.url);
        }}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
        disabled={uploading}
      >
        {remove ? (
          <div className="w-4 h-4 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
        ) : (
          <BiX className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

const StepJ = (props) => {
  const params = useParams();
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false); // Added compression state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [remove, setRemove] = useState(false);
  const fileInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ================================
  //     IMAGE COMPRESSION FUNCTIONS
  // ================================

  /**
   * Calculate proper dimensions while preserving aspect ratio
   */
  const calculateDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
    const aspectRatio = originalWidth / originalHeight;

    let newWidth = originalWidth;
    let newHeight = originalHeight;

    // Only resize if image is larger than max dimensions
    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const scaleX = maxWidth / originalWidth;
      const scaleY = maxHeight / originalHeight;
      const scale = Math.min(scaleX, scaleY);

      newWidth = Math.floor(originalWidth * scale);
      newHeight = Math.floor(originalHeight * scale);
    }

    return { newWidth, newHeight, scale: newWidth / originalWidth };
  };

  /**
   * Compress image with preserved aspect ratio
   */
  const compressImageWithAspectRatio = (file) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const originalSizeMB = file.size / (1024 * 1024);
        const targetMinKB = 500;
        const targetMaxKB = 1000;

        // Define max dimensions based on file size
        let maxDimension, initialQuality;

        if (originalSizeMB > 20) {
          maxDimension = 1600;
          initialQuality = 0.6;
        } else if (originalSizeMB > 10) {
          maxDimension = 1800;
          initialQuality = 0.7;
        } else if (originalSizeMB > 5) {
          maxDimension = 2000;
          initialQuality = 0.75;
        } else {
          maxDimension = 2200;
          initialQuality = 0.8;
        }

        // Calculate new dimensions preserving aspect ratio
        const { newWidth, newHeight } = calculateDimensions(
          img.width,
          img.height,
          maxDimension,
          maxDimension
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newWidth, newHeight);

        // Enable high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image with preserved aspect ratio
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Compression with quality adjustment
        let attempt = 0;
        const maxAttempts = 8;

        const tryCompress = (quality) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }

              const fileSizeKB = blob.size / 1024;
              attempt++;

              console.log(`🔄 Attempt ${attempt}: Quality ${quality.toFixed(2)}, Size: ${fileSizeKB.toFixed(0)}KB`);

              if ((fileSizeKB >= targetMinKB && fileSizeKB <= targetMaxKB) || attempt >= maxAttempts) {
                const originalName = file.name.split('.')[0];
                const compressedFile = new File([blob], `${originalName}.jpg`, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });

                console.log(`✅ Background compression: ${img.width}x${img.height} → ${newWidth}x${newHeight}, ${fileSizeKB.toFixed(0)}KB`);

                resolve(compressedFile);
                return;
              }

              // Adjust quality
              let newQuality;
              if (fileSizeKB > targetMaxKB) {
                const overshoot = (fileSizeKB - targetMaxKB) / targetMaxKB;
                newQuality = quality - (0.1 + overshoot * 0.1);
              } else if (fileSizeKB < targetMinKB) {
                const undershoot = (targetMinKB - fileSizeKB) / targetMinKB;
                newQuality = Math.min(0.95, quality + undershoot * 0.1);
              }

              newQuality = Math.max(0.2, Math.min(0.95, newQuality));
              setTimeout(() => tryCompress(newQuality), 100);
            },
            'image/jpeg',
            quality
          );
        };

        tryCompress(initialQuality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  /**
   * Simple fallback compression
   */
  const simpleFallback = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new window.Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const { newWidth, newHeight } = calculateDimensions(img.width, img.height, 1800, 1800);

          canvas.width = newWidth;
          canvas.height = newHeight;

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, newWidth, newHeight);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const originalName = file.name.split('.')[0];
                const result = new File([blob], `${originalName}.jpg`, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(result);
              } else {
                reject(new Error('Fallback failed'));
              }
            },
            'image/jpeg',
            0.75
          );
        };

        img.onerror = () => reject(new Error('Image load failed'));
        img.src = event.target.result;
      };

      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(file);
    });
  };

  /**
   * Process files with compression
   */
  const processFiles = async (files) => {
    const results = [];

    console.log(`🎯 Starting background compression...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);

      console.log(`📁 Processing background ${i + 1}/${files.length}: ${file.name} (${originalSizeMB}MB)`);

      try {
        let compressedFile;

        try {
          compressedFile = await compressImageWithAspectRatio(file);
        } catch (error) {
          console.log('🔄 Main method failed, using fallback...');
          compressedFile = await simpleFallback(file);
        }

        results.push(compressedFile);

      } catch (error) {
        console.error(`❌ Failed to compress ${file.name}:`, error);

        // Create placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 450;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, 800, 450);
        ctx.fillStyle = '#6c757d';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Background Error', 400, 225);

        canvas.toBlob((blob) => {
          if (blob) {
            const fallback = new File([blob], `${file.name.split('.')[0]}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            results.push(fallback);
          }
        }, 'image/jpeg', 0.8);
      }
    }

    return results;
  };

  // Configure sensors for both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setImages((items) => {
      const oldIndex = items.findIndex((item) => (item.id || item.url) === active.id);
      const newIndex = items.findIndex((item) => (item.id || item.url) === over.id);
      let newItems = arrayMove(items, oldIndex, newIndex);

      newItems = newItems.map((item, index) => ({
        ...item,
        order: index + 1
      }));

      props.setFormData((prev) => ({
        ...prev,
        imageUrls: newItems.map((img) => img.url),
      }));

      console.log("Ordered images:", newItems);
      return newItems;
    });

    setNewFiles((files) => {
      const oldIndex = files.findIndex((file) => file.previewUrl === active.id);
      const newIndex = files.findIndex((file) => file.previewUrl === over.id);
      let newFiles = arrayMove(files, oldIndex, newIndex);

      newFiles = newFiles.map((item, index) => ({
        ...item,
        order: index + 1
      }));

      console.log("Ordered newFiles:", newFiles);
      return newFiles;
    });
  };

  const generateRandomCode = (length = 5) => {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
  };

  // 1) Handle file selection with compression
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate file types
    const nonImageFiles = selectedFiles.filter((file) => !file.type.startsWith("image/"));
    if (nonImageFiles.length > 0) {
      toast({ title: 'File bukan gambar!', variant: 'destructive' });
      return;
    }

    // Validate allowed extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
    const invalidExtFiles = selectedFiles.filter((file) => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      return !allowedExtensions.includes(ext);
    });
    if (invalidExtFiles.length > 0) {
      toast({ title: 'Format gambar harus .jpg, .jpeg, .png, .webp, .gif, .avif', variant: 'destructive' });
      return;
    }

    // Validate max 5 images
    if (images.length + selectedFiles.length > 5) {
      toast({ title: 'Maksimum upload foto adalah 5!', variant: 'destructive' });
      return;
    }

    // Start compression
    setCompressing(true);

    try {
      console.log(`🚀 Starting compression for ${selectedFiles.length} background files...`);

      // Compress all files
      const compressedFiles = await processFiles(selectedFiles);

      // Generate stable preview URLs for compressed files
      const newFileData = compressedFiles.map((file, index) => {
        return {
          file,
          previewUrl: URL.createObjectURL(file),
          code: generateRandomCode(),
          order: images.length + index + 1,
        };
      });

      // Add to images for UI
      const newImageEntries = newFileData.map((item, index) => ({
        url: item.previewUrl,
        id: null,
        file: item.file,
        type: 'file',
        code: item.code,
        order: item.order,
      }));

      // Append to existing arrays
      setImages((prev) => [...prev, ...newImageEntries]);
      setNewFiles((prev) => [...prev, ...newFileData]);

      // Clear old error if any
      setErrors({ ...errors, images: undefined });

      // Show success message
      const totalSize = compressedFiles.reduce((sum, file) => sum + file.size, 0);
      const avgSizeKB = (totalSize / compressedFiles.length / 1024).toFixed(0);

      toast({
        title: `${compressedFiles.length} background berhasil dikompress`,
        // description: `Rata-rata ${avgSizeKB}KB per file`,
        variant: 'default'
      });

    } catch (error) {
      console.error('Compression error:', error);
      toast({
        title: 'Gagal mengkompress background',
        variant: 'destructive'
      });
    } finally {
      setCompressing(false);
    }
  };

  // 2) Handle removing image
  const handleRemoveImage = async (id, previewUrl, code) => {
    setRemove(true);

    console.log("Removing image with CODE:", code);

    if (id && !code || code == null || code == undefined) {
      try {
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/remove-image/${id}/${params.formId}/${params.phoneNumber}`
        );

        if (response.status === 200) {
          const updatedImages = images.filter((image) => image.id !== id);
          setImages(updatedImages);

          props.setFormData((prev) => ({
            ...prev,
            imageUrls: updatedImages.map((img) => img.url),
          }));
        } else {
          console.error("Failed to delete image on the server.");
        }
      } catch (error) {
        console.error("Error removing image:", error);
      }
    } else {
      const updatedImages = images.filter((image) => image.url !== previewUrl);
      const updatedNewFiles = newFiles.filter(
        (item) => item.previewUrl !== previewUrl
      );

      setImages(updatedImages);
      setNewFiles(updatedNewFiles);

      props.setFormData((prev) => ({
        ...prev,
        imageUrls: updatedImages.map((img) => img.url),
      }));
    }

    setRemove(false);
  };

  // 3) Handle uploading images
  const handleUploadClick = async () => {
    if (newFiles.length === 0 && images.length === 0) {
      alert("Please select at least one image to upload.");
      return;
    }

    if (newFiles.length === 0 && images.length > 0) {
      manageOrder(images);
      props.nextStep();
      return;
    }

    setUploading(true);

    const fd = new FormData();
    newFiles.forEach((item) => {
      fd.append("id", item.id);
      fd.append("order", item.order);
      fd.append("file", item.file);
      fd.append("source[]", JSON.stringify({ id: item.id, order: item.order }));

      if (props.partName === 'background') {
        fd.append("backgroundOrder", item.order);
      }
    });
    fd.append("partName", props.partName);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload-photo-v2/${params.formId}`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            const percent = Math.floor((loaded / total) * 100);
            setUploadProgress(percent);
          },
        }
      );
      console.log("Files uploaded successfully:", response);
      manageOrder(images);

      props.onFormChange();
      props.nextStep();
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      manageOrder(images);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const manageOrder = async (images) => {
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/manage-bg-order/${params.formId}/${params.phoneNumber}`, images);
      console.log("Order managed successfully:", response.data);
    } catch (error) {
      console.error("Error managing order:", error);
      return null;
    }
  }

  const handleSelectImage = (selectedAssets) => {
    if (!selectedAssets) return;

    const prevImages = images;

    const selectedArray = Array.isArray(selectedAssets)
      ? selectedAssets
      : [selectedAssets];

    const newItems = selectedArray.map((asset, index) => {
      const code = generateRandomCode();
      return {
        url: asset.imageUrl,
        id: asset.idAsset,
        file: null,
        type: 'newAsset',
        code,
        previewUrl: asset.imageUrl,
        order: prevImages.length + index + 1,
      };
    });

    const newImages = newItems.map(item => ({
      url: item.url,
      id: item.id,
      file: item.file,
      type: item.type,
      code: item.code,
      order: item.order,
    }));

    const newFilesToAdd = newItems.map(item => ({
      previewUrl: item.previewUrl,
      file: item.file,
      id: item.id,
      code: item.code,
      order: item.order,
    }));

    setImages(prev => {
      if (prev.length >= 5) {
        alert("Maksimal 5 gambar dapat dipilih.");
        return prev;
      }
      return [...prev, ...newImages].slice(0, 5);
    });

    setNewFiles(prev => {
      return [...prev, ...newFilesToAdd].slice(0, 5);
    });

    props.setFormData(prev => ({
      ...prev,
      imageUrls: [
        ...(prev.imageUrls || []),
        ...newImages.map(img => img.url),
      ].slice(0, 5),
    }));
  };

  // 4) Fetch existing images from the server
  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/get-gallery/${params.formId}/${params.phoneNumber}`,
        {
          params: {
            partName: props.partName,
          },
        }
      );

      const imagesData = response.data.data.map((item) => ({
        url: item.images.fileImage
          ? `${process.env.NEXT_PUBLIC_API_URL}/images/${item.images.fileImage}`
          : `${process.env.NEXT_PUBLIC_API_URL}/images/${item.asset.file}`,
        id: item.id,
        file: null,
        type: item.images.fileImage ? "images" : "asset",
        order: item.order,
      }));
      setImages(imagesData);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log('newFiles', newFiles);
    console.log('images', images);
  }, [images, newFiles]);

  // ========== RENDER ========== //
  return (
    <div className="relative min-h-screen p-4 text-center flex-grow">
      {uploading && <LoadingOverlay progress={uploadProgress} />}

      {/* Compression Loading Overlay */}
      {compressing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-6 h-6 border-4 border-t-transparent border-purple-500 rounded-full animate-spin"></div>
              <span className="font-semibold">Memproses Background...</span>
            </div>
            {/* <p className="text-sm text-gray-600">Mempertahankan aspect ratio</p>
            <p className="text-xs text-gray-500 mt-1">Target: 500KB-1MB per background</p> */}
          </div>
        </div>
      )}

      <ModalAsset
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectImage={handleSelectImage}
        selectType="multiple"
        partName={props.partName}
        length={images.length}
      />

      <div className="flex flex-col mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold flex-grow text-center">
            {props.number}. {props.title} (Max. 5 Foto)
          </h2>
          <Button id="btn-asset" onClick={() => setIsModalOpen(true)}>
            <FaImages className="text-lg" />
          </Button>
        </div>

        <div className="flex items-center justify-center mt-1 text-yellow-600 text-sm gap-1">
          <AlertTriangle className="w-4 h-4" />
          <span>Minimal upload 4 foto</span>
        </div>
      </div>


      {/* <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2 text-sm">
        <p className="text-purple-800 font-medium">🎯 Kompresi Background Pintar</p>
        <p className="text-purple-700">Background akan dikompress dengan aspect ratio terjaga</p>
      </div> */}

      <p className="text-red-500 text-sm mb-2">
        Note: Drag gambar untuk atur urutan foto
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((item) => item.id || item.url)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {images.length > 0 ? (
              images.map((image) => (
                <SortableItem
                  key={image.id ?? image.url ?? image.code}
                  item={image}
                  onRemove={() => handleRemoveImage(image.id, image.url, image.code)}
                  uploading={uploading}
                  remove={remove}
                />
              ))
            ) : (
              <div className="col-span-2 md:col-span-3">
                <Image
                  src={placeholder.src}
                  alt="Cover"
                  width={300}
                  height={350}
                  className="mx-auto mt-4"
                />
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {errors.images && <p className="text-red-500">{errors.images}</p>}

      <div className="flex justify-center gap-x-4 pb-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept="image/*"
          multiple
        />
        <Button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading || compressing}
        >
          {compressing ? "Processing..." : images.length > 0 ? "Ganti Foto" : "Upload Photos"}
        </Button>
        <Button
          onClick={handleUploadClick}
          disabled={uploading || compressing || (images.length <= 3)}
        >
          {uploading ? "Uploading..." : "Selanjutnya"}
        </Button>
      </div>
    </div>
  );
};

export default StepJ;
