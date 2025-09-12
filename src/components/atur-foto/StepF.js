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

const StepF = ({ number, nextStep, formData, setFormData, onFormChange, partName, title }) => {
  const params = useParams();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressing, setCompressing] = useState(false);

  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [remove, setRemove] = useState(false);
  const fileInputRef = useRef(null);

  // ================================
  //   FIXED COMPRESSION - PRESERVE ASPECT RATIO
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
      // Calculate scaling factor to fit within max dimensions
      const scaleX = maxWidth / originalWidth;
      const scaleY = maxHeight / originalHeight;
      const scale = Math.min(scaleX, scaleY); // Use the smaller scale to ensure both dimensions fit
      
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
        
        // Define max dimensions based on file size, but preserve aspect ratio
        let maxDimension;
        let initialQuality;
        
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
        const { newWidth, newHeight, scale } = calculateDimensions(
          img.width, 
          img.height, 
          maxDimension, 
          maxDimension
        );
        
        console.log(`📐 Original: ${img.width}x${img.height}`);
        console.log(`📐 New: ${newWidth}x${newHeight} (scale: ${scale.toFixed(3)})`);
        console.log(`📏 Aspect ratio preserved: ${(img.width/img.height).toFixed(3)} → ${(newWidth/newHeight).toFixed(3)}`);
        
        // Set canvas to exact calculated dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, newWidth, newHeight);
        
        // Enable high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image with exact aspect ratio preservation
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
              
              // Check if acceptable or max attempts reached
              if ((fileSizeKB >= targetMinKB && fileSizeKB <= targetMaxKB) || attempt >= maxAttempts) {
                const originalName = file.name.split('.')[0];
                const compressedFile = new File([blob], `${originalName}.jpg`, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                
                const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                const finalSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
                const reductionPercent = (((file.size - compressedFile.size) / file.size) * 100).toFixed(1);
                
                console.log(`✅ Compression complete for ${file.name}:`);
                console.log(`📏 Dimensions: ${img.width}x${img.height} → ${newWidth}x${newHeight}`);
                console.log(`📊 Aspect ratio check: ${(img.width/img.height).toFixed(3)} = ${(newWidth/newHeight).toFixed(3)}`);
                console.log(`📦 Size: ${originalSizeMB}MB → ${finalSizeMB}MB (${fileSizeKB.toFixed(0)}KB)`);
                console.log(`📉 Reduction: ${reductionPercent}%`);
                
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
   * Simple fallback with strict aspect ratio preservation
   */
  const simpleFallback = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new window.Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate dimensions with strict aspect ratio preservation
          const { newWidth, newHeight } = calculateDimensions(img.width, img.height, 1800, 1800);
          
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          // White background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, newWidth, newHeight);
          
          // High quality rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw with preserved aspect ratio
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const originalName = file.name.split('.')[0];
                const result = new File([blob], `${originalName}.jpg`, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                
                console.log(`🔄 Fallback: ${img.width}x${img.height} → ${newWidth}x${newHeight}`);
                console.log(`📊 Aspect ratio maintained: ${(img.width/img.height).toFixed(3)} = ${(newWidth/newHeight).toFixed(3)}`);
                
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
   * Process files with aspect ratio preservation
   */
  const processFiles = async (files) => {
    const results = [];
    
    console.log(`🎯 Starting compression with aspect ratio preservation...`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      console.log(`\n📁 Processing ${i + 1}/${files.length}: ${file.name} (${originalSizeMB}MB)`);
      
      try {
        let compressedFile;
        
        try {
          compressedFile = await compressImageWithAspectRatio(file);
        } catch (error) {
          console.log('🔄 Main method failed, using simple fallback...');
          compressedFile = await simpleFallback(file);
        }
        
        results.push(compressedFile);
        
      } catch (error) {
        console.error(`❌ Failed to compress ${file.name}:`, error);
        
        // Create placeholder maintaining 16:9 aspect ratio
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 450; // 16:9 aspect ratio
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

  // ================================
  //       HANDLE FILE INPUT
  // ================================
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validation
    const nonImageFiles = selectedFiles.filter((file) => !file.type.startsWith("image/"));
    if (nonImageFiles.length > 0) {
      toast({ title: 'File bukan gambar!', variant: 'destructive' });
      return;
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
    const invalidExtFiles = selectedFiles.filter((file) => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      return !allowedExtensions.includes(ext);
    });
    if (invalidExtFiles.length > 0) {
      toast({ title: 'Format tidak didukung!', variant: 'destructive' });
      return;
    }

    if (images.length + selectedFiles.length > 15) {
      toast({ title: 'Maksimum 15 foto!', variant: 'destructive' });
      return;
    }

    setCompressing(true);
    
    try {
      const compressedFiles = await processFiles(selectedFiles);
      
      const newFileData = compressedFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      const newImageEntries = newFileData.map((item) => ({
        url: item.previewUrl,
        id: null,
        file: item.file,
      }));

      setImages((prev) => [...prev, ...newImageEntries]);
      setNewFiles((prev) => [...prev, ...newFileData]);
      setErrors((prev) => ({ ...prev, images: undefined }));
      
      const totalSize = compressedFiles.reduce((sum, file) => sum + file.size, 0);
      const avgSizeKB = (totalSize / compressedFiles.length / 1024).toFixed(0);
      
      toast({ 
        title: `${compressedFiles.length} gambar berhasil dikompress`,
        // description: `Rata-rata ${avgSizeKB}KB per file dengan aspect ratio terjaga`,
        variant: 'default'
      });
      
    } catch (error) {
      console.error('Compression error:', error);
      toast({ 
        title: 'Gagal mengkompress', 
        variant: 'destructive' 
      });
    } finally {
      setCompressing(false);
    }
  };

  // Rest of component methods remain the same...
  const handleRemoveImage = async (id, previewUrl) => {
    setRemove(true);
    if (id) {
      try {
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/remove-image/${id}/${params.formId}/${params.phoneNumber}`
        );
        if (response.status === 200) {
          const updatedImages = images.filter((img) => img.id !== id);
          setImages(updatedImages);
          setFormData((prev) => ({
            ...prev,
            imageUrls: updatedImages.map((img) => img.url),
          }));
        }
      } catch (error) {
        console.error("Error removing image:", error);
      }
    } else {
      const updatedImages = images.filter((img) => img.url !== previewUrl);
      const updatedNewFiles = newFiles.filter((item) => item.previewUrl !== previewUrl);
      setImages(updatedImages);
      setNewFiles(updatedNewFiles);
      setFormData((prev) => ({
        ...prev,
        imageUrls: updatedImages.map((img) => img.url),
      }));
    }
    setRemove(false);
  };

  const handleUploadClick = async () => {
    if (newFiles.length === 0 && images.length === 0) {
      alert("Please select at least one image to upload.");
      return;
    }
    if (newFiles.length === 0 && images.length > 0) {
      nextStep();
      return;
    }

    setUploading(true);
    const fd = new FormData();
    newFiles.forEach((item) => {
      fd.append("file", item.file);
    });
    fd.append("partName", partName);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload-photo-v2/${params.formId}`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.floor((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(percent);
          },
        }
      );
      console.log("Files uploaded successfully:", response);
      onFormChange();
      nextStep();
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/get-gallery/${params.formId}/${params.phoneNumber}`,
        { params: { partName } }
      );
      const imagesData = response.data.data.map((item) => ({
        url: `${process.env.NEXT_PUBLIC_API_URL}/images/${item.images.fileImage}`,
        id: item.id,
        file: null,
      }));
      setImages(imagesData);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="relative min-h-screen p-4 text-center flex-grow">
      {uploading && <LoadingOverlay progress={uploadProgress} />}
      
      {compressing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-6 h-6 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              <span className="font-semibold">Kompresi Gallery...</span>
            </div>
            {/* <p className="text-sm text-gray-600">Mempertahankan aspect ratio</p>
            <p className="text-xs text-gray-500 mt-1">Target: 500KB-1MB</p> */}
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-2">
        {number}. {title} (Max. 15 Foto)
      </h2>
      
      {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
        <p className="text-blue-800 font-medium">🎯 Kompresi Pintar</p>
        <p className="text-blue-700">Mempertahankan aspect ratio asli gambar</p>
      </div> */}

      <div className="flex flex-wrap items-center justify-center mb-4 gap-4">
        {images.length > 0 ? (
          images.map((image, index) => (
            <div key={image.id || index} className="relative mt-4">
              <img
                src={image.url}
                alt={`Preview ${index + 1}`}
                width={150}
                height={150}
                className="rounded object-cover border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(image.id, image.url)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                disabled={uploading || compressing}
              >
                {remove ? (
                  <div className="w-4 h-4 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  <BiX className="h-4 w-4" />
                )}
              </button>
            </div>
          ))
        ) : (
          <NextImage src={placeholder.src} alt="Cover" width={300} height={350} className="mt-4" />
        )}
      </div>

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
          {images.length > 0 ? "Ganti Foto" : "Upload Photos"}
        </Button>
        <Button
          onClick={handleUploadClick}
          disabled={uploading || compressing || (images.length === 0 && newFiles.length === 0)}
        >
          {uploading ? "Uploading..." : "Selanjutnya"}
        </Button>
      </div>
      
      <Button
        variant="ghost"
        className="text-gray-700 hover:text-gray-900 text-sm mb-8"
        onClick={() => { onFormChange(); nextStep(); }}
        disabled={uploading || compressing}
      >
        Skip
      </Button>
    </div>
  );
};

export default StepF;
