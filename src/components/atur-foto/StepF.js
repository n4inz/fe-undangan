// GALLERY
import { useEffect, useRef, useState, useCallback } from "react";
import NextImage from "next/image";
import { Button } from "../ui/button";
import axios from "axios";
import { useParams } from "next/navigation";
import placeholder from "/public/images/placeholder.webp";
import { BiChevronDown, BiChevronUp, BiX } from "react-icons/bi";
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

// util: helper to await canvas.toBlob
const canvasToBlob = (canvas, type = 'image/jpeg', quality = 0.8) => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
};

// Improved compress using createImageBitmap (falls back to Image if not available)
const compressImageWithAspectRatio = async (file) => {
  // try to decode using createImageBitmap (more robust)
  let bitmap;
  try {
    if (window.createImageBitmap) {
      // createImageBitmap supports passing a Blob/File directly
      bitmap = await createImageBitmap(file);
    }
  } catch (err) {
    console.warn('createImageBitmap failed, falling back to Image():', err);
  }

  // if bitmap is available use it; otherwise use Image + FileReader as fallback
  if (!bitmap) {
    // previous approach but wrapped in Promise and using image.decode()
    await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.onload = async (e) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image (Image fallback)'));
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }).then((imgOrNothing) => {
      // if we fallbacked to Image, createImageBitmap could be used from the image:
      // but simpler: create an offscreen canvas from that image below (we'll handle in common code)
      bitmap = imgOrNothing; // might be HTMLImageElement or undefined if using createImageBitmap earlier
    }).catch((err) => {
      throw err;
    });
  }

  // compute dimensions regardless whether bitmap is ImageBitmap or HTMLImageElement
  const width = bitmap.width || bitmap.naturalWidth;
  const height = bitmap.height || bitmap.naturalHeight;

  const originalSizeMB = file.size / (1024 * 1024);
  let maxDimension = 2200;
  let initialQuality = 0.8;
  if (originalSizeMB > 20) {
    maxDimension = 1600; initialQuality = 0.6;
  } else if (originalSizeMB > 10) {
    maxDimension = 1800; initialQuality = 0.7;
  } else if (originalSizeMB > 5) {
    maxDimension = 2000; initialQuality = 0.75;
  }

  const { newWidth, newHeight } = calculateDimensions(width, height, maxDimension, maxDimension);

  // draw on canvas
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, newWidth, newHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // if bitmap is an ImageBitmap use drawImage(bitmap), else if it's an Image element use drawImage(img, ...)
  try {
    ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  } catch (err) {
    // drawing failed; rethrow to be handled by caller
    throw new Error('Failed to draw image to canvas: ' + (err.message || err));
  } finally {
    // if bitmap is ImageBitmap, close to free memory
    if (bitmap && bitmap.close) {
      try { bitmap.close(); } catch (e) { /* ignore */ }
    }
  }

  // iterative compression loop (awaiting canvasToBlob)
  let attempt = 0;
  const maxAttempts = 8;
  const targetMinKB = 500;
  const targetMaxKB = 1000;
  let quality = initialQuality;

  while (attempt < maxAttempts) {
    attempt++;
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    if (!blob) throw new Error('canvas.toBlob returned null');

    const fileSizeKB = blob.size / 1024;
    console.log(`🔄 [${file.name}] attempt ${attempt} quality=${quality.toFixed(2)} size=${fileSizeKB.toFixed(0)}KB`);

    if ((fileSizeKB >= targetMinKB && fileSizeKB <= targetMaxKB) || attempt >= maxAttempts) {
      const originalName = file.name.split('.')[0];
      return new File([blob], `${originalName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    }

    // adjust quality
    if (fileSizeKB > targetMaxKB) {
      const overshoot = (fileSizeKB - targetMaxKB) / targetMaxKB;
      quality = quality - (0.1 + overshoot * 0.1);
    } else {
      const undershoot = (targetMinKB - fileSizeKB) / targetMinKB;
      quality = Math.min(0.95, quality + undershoot * 0.1);
    }
    // clamp
    quality = Math.max(0.2, Math.min(0.95, quality));
  }

  // fallback: return last produced blob (shouldn't reach because loop returns)
  const finalBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
  const originalName = file.name.split('.')[0];
  return new File([finalBlob], `${originalName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
};

// Improved simpleFallback using await canvasToBlob and createImageBitmap fallback
const simpleFallback = async (file) => {
  // use createImageBitmap if available for decode
  let bitmap;
  try {
    if (window.createImageBitmap) {
      bitmap = await createImageBitmap(file);
    }
  } catch (err) {
    // fallback to img FileReader approach
    await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('FileReader failed in fallback'));
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => { bitmap = img; resolve(); };
        img.onerror = () => reject(new Error('Image load failed in fallback'));
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const { newWidth, newHeight } = calculateDimensions(bitmap.width || bitmap.naturalWidth, bitmap.height || bitmap.naturalHeight, 1800, 1800);
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, newWidth, newHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.75);
  if (!blob) throw new Error('Fallback canvas.toBlob returned null');
  const originalName = file.name.split('.')[0];
  // close imageBitmap if possible
  if (bitmap && bitmap.close) try { bitmap.close(); } catch(e) {}
  return new File([blob], `${originalName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
};

// IMPORTANT: processFiles must await the placeholder toBlob too
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
        console.warn('🔄 Main method failed, using fallback for', file.name, error);
        compressedFile = await simpleFallback(file);
      }
      results.push(compressedFile);
    } catch (error) {
      console.error(`❌ Failed to compress ${file.name}:`, error);

      // Create placeholder (await the blob creation)
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

      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.8);
      if (blob) {
        const fallback = new File([blob], `${file.name.split('.')[0]}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        results.push(fallback);
      } else {
        // last-resort: push original file (or skip) — choose to push original to avoid index mismatch
        results.push(file);
      }
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
    // console.log("📤 Upload click triggered");
    // console.log("📁 NewFiles to upload:", newFiles.length);
    // console.log("🖼️ Total images:", images.length);

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

  // useEffect(() => {
  //   console.log("🔄 State updated - newFiles:", newFiles.length, "images:", images.length);
  // }, [images, newFiles]);

  // RENDER
  return (
    <div className="relative min-h-screen p-4 text-center">
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
            {/* <p className="text-sm text-gray-600">Mempertahankan aspect ratio</p>
            <p className="text-xs text-gray-500 mt-1">Target: 500KB-1MB per foto</p> */}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex-grow text-center">
          {props.number}. {props.title} (Max. 15 Foto)
        </h2>
      </div>

      <p className="text-blue-600 text-sm mb-2">
        <strong>💡 Tips:</strong> Drag foto untuk atur urutan
      </p>

      {/* Drag and Drop Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        className="mb-10"
      >
        <SortableContext
          items={images.map((item) => item.id || item.url)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pb-48">
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

      {/* Floating container */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">

        {/* baris utama tombol */}
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
            {compressing
              ? "Processing..."
              : images.length > 0
                ? "Tambah Foto"
                : "Pilih Foto"}
          </Button>

          <Button
            onClick={handleUploadClick}
            disabled={uploading || compressing || (images.length === 0 && newFiles.length === 0)}
          >
            {uploading ? `Uploading... ${uploadProgress}%` : "Selanjutnya"}
          </Button>
        </div>

        {/* tombol Skip tetap di bawah */}
        <Button
          variant="ghost"
          className="text-gray-700 hover:text-gray-900 text-sm w-full"
          onClick={() => { props.onFormChange(); props.nextStep(); }}
          disabled={uploading || compressing}
        >
          Skip
        </Button>
      </div>


    </div>
  );
};

export default StepF;
