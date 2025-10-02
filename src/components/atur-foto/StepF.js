// GALLERY
import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { Button } from "../ui/button";
import axios from "axios";
import { useParams } from "next/navigation";
import placeholder from "/public/images/placeholder.png";
import { BiX } from "react-icons/bi";
import LoadingOverlay from "./LoadingOverlay";
import { toast } from "../ui/use-toast";

// dnd-kit imports untuk drag foto
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

// Sortable item component untuk drag foto
const SortableItem = ({ item, onRemove, uploading, remove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id: item.id || item.url 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
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

      {/* Handle untuk drag - tidak termasuk button remove */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ zIndex: 1 }}
      />

      {/* Button remove dengan z-index tinggi */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          console.log("🗑️ Remove button clicked:", item.id, item.code);
          onRemove();
        }}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-20"
        disabled={uploading}
        style={{ zIndex: 20 }}
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

const StepF = (props) => {
  const params = useParams();
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [remove, setRemove] = useState(false);
  const fileInputRef = useRef(null);

  // ================================
  // IMAGE COMPRESSION FUNCTIONS
  // ================================

  const calculateDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
    const aspectRatio = originalWidth / originalHeight;
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const scaleX = maxWidth / originalWidth;
      const scaleY = maxHeight / originalHeight;
      const scale = Math.min(scaleX, scaleY);

      newWidth = Math.floor(originalWidth * scale);
      newHeight = Math.floor(originalHeight * scale);
    }

    return { newWidth, newHeight, scale: newWidth / originalWidth };
  };

  const compressImageWithAspectRatio = (file) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const originalSizeMB = file.size / (1024 * 1024);
        const targetMinKB = 500;
        const targetMaxKB = 1000;

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

        const { newWidth, newHeight } = calculateDimensions(
          img.width,
          img.height,
          maxDimension,
          maxDimension
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newWidth, newHeight);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

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

                console.log(`✅ Compression complete: ${img.width}x${img.height} → ${newWidth}x${newHeight}, ${fileSizeKB.toFixed(0)}KB`);
                resolve(compressedFile);
                return;
              }

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

  const processFiles = async (files) => {
    const results = [];
    console.log(`🎯 Starting compression for ${files.length} files...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);

      console.log(`📁 Processing file ${i + 1}/${files.length}: ${file.name} (${originalSizeMB}MB)`);

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
        ctx.fillText('Image Error', 400, 225);

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

    console.log("🔄 Drag end:", active.id, "->", over.id);

    setImages((items) => {
      const oldIndex = items.findIndex((item) => (item.id || item.url) === active.id);
      const newIndex = items.findIndex((item) => (item.id || item.url) === over.id);

      if (oldIndex === -1 || newIndex === -1) return items;

      let newItems = arrayMove(items, oldIndex, newIndex);

      newItems = newItems.map((item, index) => ({
        ...item,
        order: index + 1
      }));

      props.setFormData((prev) => ({
        ...prev,
        imageUrls: newItems.map((img) => img.url),
      }));

      console.log("✅ Images reordered:", newItems);
      return newItems;
    });

    setNewFiles((files) => {
      const oldIndex = files.findIndex((file) => file.previewUrl === active.id);
      const newIndex = files.findIndex((file) => file.previewUrl === over.id);

      if (oldIndex === -1 || newIndex === -1) return files;

      let newFiles = arrayMove(files, oldIndex, newIndex);

      newFiles = newFiles.map((item, index) => ({
        ...item,
        order: index + 1
      }));

      console.log("✅ NewFiles reordered:", newFiles);
      return newFiles;
    });
  };

  const generateRandomCode = (length = 8) => {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
  };

  const generateUniqueId = () => {
    return Date.now() + Math.random().toString(36).substring(2, 9);
  };

  // 1. Handle file selection with compression
  const handleFileChange = async (e) => {
    console.log("📁 File selection triggered");

    const selectedFiles = Array.from(e.target.files);
    console.log("📁 Selected files:", selectedFiles.length);

    if (selectedFiles.length === 0) {
      console.log("❌ No files selected");
      return;
    }

    // Validate file types
    const nonImageFiles = selectedFiles.filter((file) => !file.type.startsWith("image/"));
    if (nonImageFiles.length > 0) {
      console.log("❌ Non-image files detected:", nonImageFiles);
      toast({ title: 'File bukan gambar!', variant: 'destructive' });
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate allowed extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
    const invalidExtFiles = selectedFiles.filter((file) => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      return !allowedExtensions.includes(ext);
    });

    if (invalidExtFiles.length > 0) {
      console.log("❌ Invalid extensions:", invalidExtFiles);
      toast({ title: 'Format gambar harus .jpg, .jpeg, .png, .webp, .gif, .avif', variant: 'destructive' });
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate max 15 images
    if (images.length + selectedFiles.length > 15) {
      console.log("❌ Too many images:", images.length + selectedFiles.length);
      toast({ title: 'Maksimum upload foto adalah 15!', variant: 'destructive' });
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Start compression
    console.log("🔄 Starting compression...");
    setCompressing(true);

    try {
      // Compress all files
      const compressedFiles = await processFiles(selectedFiles);
      console.log("✅ Compression completed:", compressedFiles.length);

      // Generate stable preview URLs for compressed files
      const newFileData = compressedFiles.map((file, index) => {
        const uniqueId = generateUniqueId();
        const code = generateRandomCode();

        return {
          id: uniqueId,
          file,
          previewUrl: URL.createObjectURL(file),
          code: code,
          order: images.length + index + 1,
        };
      });

      // Add to images for UI
      const newImageEntries = newFileData.map((item) => ({
        url: item.previewUrl,
        id: null, // Will be assigned after upload
        file: item.file,
        type: "file",
        code: item.code,
        order: item.order,
        uniqueId: item.id, // Keep track of unique ID
      }));

      console.log("📁 New file data:", newFileData);
      console.log("🖼️ New image entries:", newImageEntries);

      // Append to existing arrays
      setImages((prev) => {
        const updated = [...prev, ...newImageEntries];
        console.log("🖼️ Updated images state:", updated);
        return updated;
      });

      setNewFiles((prev) => {
        const updated = [...prev, ...newFileData];
        console.log("📁 Updated newFiles state:", updated);
        return updated;
      });

      // Clear errors
      setErrors({ ...errors, images: undefined });

      // Show success message
      const totalSize = compressedFiles.reduce((sum, file) => sum + file.size, 0);
      const avgSizeKB = (totalSize / compressedFiles.length / 1024).toFixed(0);

      toast({
        title: `${compressedFiles.length} foto berhasil dikompress`,
        description: `Rata-rata ${avgSizeKB}KB per file`,
        variant: 'default'
      });

      console.log("✅ Files successfully added to state");
    } catch (error) {
      console.error('❌ Compression error:', error);
      toast({ title: 'Gagal mengkompress foto', variant: 'destructive' });
    } finally {
      setCompressing(false);
      // Reset file input untuk allow same files to be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 2. Handle removing image
  const handleRemoveImage = async (id, previewUrl, code) => {
    console.log("🗑️ Remove image called:", { id, previewUrl, code });
    setRemove(true);

    if (id && code && code !== null && code !== undefined) {
      // This is an uploaded image - call API to remove
      console.log("🗑️ Removing uploaded image from server:", id);
      try {
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/remove-image/${id}/${params.formId}/${params.phoneNumber}`
        );
        if (response.status === 200) {
          console.log("✅ Image removed from server successfully");
          const updatedImages = images.filter((image) => image.id !== id);
          setImages(updatedImages);
          props.setFormData((prev) => ({
            ...prev,
            imageUrls: updatedImages.map((img) => img.url),
          }));
        } else {
          console.error("❌ Failed to delete image on the server.");
        }
      } catch (error) {
        console.error("❌ Error removing image:", error);
      }
    } else {
      // This is a new file - remove from local state
      console.log("🗑️ Removing new file from local state:", previewUrl);
      const updatedImages = images.filter((image) => image.url !== previewUrl);
      const updatedNewFiles = newFiles.filter((item) => item.previewUrl !== previewUrl);

      console.log("🗑️ Updated images after remove:", updatedImages);
      console.log("🗑️ Updated newFiles after remove:", updatedNewFiles);

      setImages(updatedImages);
      setNewFiles(updatedNewFiles);
      props.setFormData((prev) => ({
        ...prev,
        imageUrls: updatedImages.map((img) => img.url),
      }));

      console.log("✅ New file removed successfully");
    }
    setRemove(false);
  };

  // 3. Handle uploading images
  const handleUploadClick = async () => {
    console.log("📤 Upload click triggered");
    console.log("📁 NewFiles to upload:", newFiles.length);
    console.log("🖼️ Total images:", images.length);

    if (newFiles.length === 0 && images.length === 0) {
      alert("Please select at least one image to upload.");
      return;
    }

    if (newFiles.length === 0 && images.length > 0) {
      console.log("📤 No new files to upload, managing order and proceeding");
      await manageOrder(images);
      props.nextStep();
      return;
    }

    console.log("📤 Starting upload process...");
    setUploading(true);
    const fd = new FormData();

    // Add all newFiles to FormData
    newFiles.forEach((item, index) => {
      console.log(`📤 Adding file ${index + 1} to FormData:`, item);
      fd.append("id", item.id || '');
      fd.append("order", item.order || index + 1);
      fd.append("file", item.file);
      fd.append("source", JSON.stringify({ id: item.id, order: item.order }));
    });

    if (props.partName === "background") {
      newFiles.forEach((item) => {
        fd.append("backgroundOrder", item.order);
      });
    }
    fd.append("partName", props.partName);

    console.log("📤 FormData prepared, sending to server...");

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload-photo-v2/${params.formId}`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            const percent = Math.floor((loaded / total) * 100);
            setUploadProgress(percent);
            console.log(`📤 Upload progress: ${percent}%`);
          },
        }
      );

      console.log("✅ Files uploaded successfully:", response);
      await manageOrder(images);
      props.onFormChange();
      props.nextStep();
    } catch (error) {
      console.error("❌ Error uploading files:", error);
      toast({ title: 'Gagal mengupload foto', variant: 'destructive' });
    } finally {
      await manageOrder(images);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Manage Order
  const manageOrder = async (images) => {
    console.log("📋 Managing order for images:", images);
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/manage-bg-order/${params.formId}/${params.phoneNumber}`,
        images
      );
      console.log("✅ Order managed successfully:", response.data);
    } catch (error) {
      console.error("❌ Error managing order:", error);
      return null;
    }
  };

  // 4. Fetch existing images from the server
  const fetchData = async () => {
    console.log("🔄 Fetching existing images...");
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/get-gallery/${params.formId}/${params.phoneNumber}`,
        { params: { partName: props.partName } }
      );

      console.log("📥 Fetched data:", response.data);

      const imagesData = response.data.data.map((item) => ({
        url: item.images.fileImage 
          ? `${process.env.NEXT_PUBLIC_API_URL}/images/${item.images.fileImage}`
          : `${process.env.NEXT_PUBLIC_API_URL}/images/${item.asset.file}`,
        id: item.id,
        file: null,
        type: item.images.fileImage ? "images" : "asset",
        order: item.order,
        code: item.code || generateRandomCode(), // Ensure code exists
      }));

      console.log("🖼️ Processed images data:", imagesData);
      setImages(imagesData);
    } catch (error) {
      console.error("❌ Error fetching images:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log("🔄 State updated - newFiles:", newFiles.length, "images:", images.length);
  }, [images, newFiles]);

  // RENDER
  return (
    <div className="relative min-h-screen p-4 text-center flex-grow">
      {/* Upload Loading Overlay */}
      {uploading && <LoadingOverlay progress={uploadProgress} />}

      {/* Compression Loading Overlay */}
      {compressing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-6 h-6 border-4 border-t-transparent border-purple-500 rounded-full animate-spin"></div>
              <span className="font-semibold">Memproses Foto...</span>
            </div>
            <p className="text-sm text-gray-600">Mempertahankan aspect ratio</p>
            <p className="text-xs text-gray-500 mt-1">Target: 500KB-1MB per foto</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex-grow text-center">
          {props.number}. {props.title} (Max. 15 Foto)
        </h2>
      </div>

      {/* <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2 text-sm">
        <p className="text-purple-800 font-medium">🎯 Kompresi Foto Pintar</p>
        <p className="text-purple-700">Foto akan dikompress dengan aspect ratio terjaga</p>
      </div> */}

      <p className="text-blue-600 text-sm mb-2">
        <strong>💡 Tips:</strong> Drag foto untuk atur urutan
      </p>

      {/* Drag and Drop Context */}
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
                  key={image.id ?? image.url ?? image.code ?? image.uniqueId}
                  item={image}
                  onRemove={() => handleRemoveImage(image.id, image.url, image.code)}
                  uploading={uploading}
                  remove={remove}
                />
              ))
            ) : (
              <div className="col-span-2 md:col-span-3">
                <NextImage
                  src={placeholder.src}
                  alt="Placeholder"
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
          onClick={() => {
            console.log("🔘 Upload button clicked");
            fileInputRef.current?.click();
          }}
          disabled={uploading || compressing}
        >
          {compressing ? "Processing..." : images.length > 0 ? "Tambah Foto" : "Pilih Foto"}
        </Button>

        <Button
          onClick={handleUploadClick}
          disabled={uploading || compressing || (images.length === 0 && newFiles.length === 0)}
        >
          {uploading ? `Uploading... ${uploadProgress}%` : "Selanjutnya"}
        </Button>
      </div>

      {/* Debug Info */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left">
          <p><strong>Debug Info:</strong></p>
          <p>Images: {images.length} | NewFiles: {newFiles.length}</p>
          <p>Uploading: {uploading.toString()} | Compressing: {compressing.toString()}</p>
        </div>
      )} */}
    </div>
  );
};

export default StepF;
