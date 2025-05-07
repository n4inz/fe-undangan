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

// const StepJ = ({ number, nextStep, setFormData, onFormChange, partName, props }) => {
const StepJ = (props) => {
  const params = useParams();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [remove, setRemove] = useState(false);
  const fileInputRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      // Add order field starting from 1
      newItems = newItems.map((item, index) => ({
        ...item,
        order: index + 1
      }));

      // Update form data with new order
      props.setFormData((prev) => ({
        ...prev,
        imageUrls: newItems.map((img) => img.url),
      }));

      // Log the ordered array
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

      // Log the ordered newFiles array
      console.log("Ordered newFiles:", newFiles);

      return newFiles;
    });
  };

  const generateRandomCode = (length = 5) => {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
  };

  // 1) Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);



    // Validate file types
    const nonImageFiles = selectedFiles.filter((file) => !file.type.startsWith("image/"));
    if (nonImageFiles.length > 0) {
      setErrors({ ...errors, images: "Only image files are allowed" });
      return;
    }

    // Validate max 5 images
    if (images.length + selectedFiles.length > 5) {
      setErrors({ ...errors, images: "Maximum upload is 5 images" });
      return;
    }

    // Generate a *stable* previewUrl for each file, and store it
    const newFileData = selectedFiles.map((file, index) => {
      return {
        file,
        previewUrl: URL.createObjectURL(file), // generate ONCE
        code: generateRandomCode(), // generate a random code for each file
        order: images.length + index + 1,
      };
    });

    // Add to images for UI (each item will contain { url, id, file })
    const newImageEntries = newFileData.map((item, index) => ({
      url: item.previewUrl, // local preview URL
      id: null,             // no ID yet since not uploaded
      file: item.file,      // keep the raw File
      type: 'file',
      code: item.code, // generate a random code for each file
      order: item.order, // order for sorting
    }));
    // Append to existing arrays
    setImages((prev) => [...prev, ...newImageEntries]);
    setNewFiles((prev) => [...prev, ...newFileData]);

    // Clear old error if any
    setErrors({ ...errors, images: undefined });
  };

  // 2) Handle removing image
  const handleRemoveImage = async (id, previewUrl, code) => {
    setRemove(true);

    console.log("Removing image with CODE:", code);

    if (id && !code || code == null || code == undefined) {
      // ========== REMOVING A SERVER-STORED IMAGE ========== //
      try {
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/remove-image/${id}/${params.formId}/${params.phoneNumber}`
        );

        if (response.status === 200) {
          // Filter out the removed image by ID
          const updatedImages = images.filter((image) => image.id !== id);
          setImages(updatedImages);

          // Update formData if you’re using it
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
      // ========== REMOVING A LOCALLY ADDED (NOT YET UPLOADED) IMAGE ========== //
      // 1. Remove from images
      const updatedImages = images.filter((image) => image.url !== previewUrl);

      // 2. Remove from newFiles by matching the stable previewUrl
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
    // If no files and no images left, prompt user
    if (newFiles.length === 0 && images.length === 0) {
      alert("Please select at least one image to upload.");
      return;
    }

    // If no new files but existing images are present, skip upload
    if (newFiles.length === 0 && images.length > 0) {
      manageOrder(images);
      props.nextStep();
      return;
    }

    setUploading(true);

    // Build FormData
    const fd = new FormData();
    newFiles.forEach((item) => {
      fd.append("id", item.id); // ID of the image (if any)
      fd.append("order", item.order); // Order of the image
      fd.append("file", item.file); // only the remaining files
      fd.append("source[]", JSON.stringify({ id: item.id, order: item.order })); // source of the image (file or asset)
      
      
      
      // If it's a background, append the order separately
      if (props.partName === 'background') {
        fd.append("backgroundOrder", item.order);
      }
    });
    // Add partName for each file (or keep it outside if it's the same for all)
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

      // Possibly refresh or do something else
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
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/manage-bg-order/${params.formId}/${params.phoneNumber}`, images // Wrap images in an object as the request body
      );

      console.log("Order managed successfully:", response.data);

    } catch (error) {
      console.error("Error managing order:", error);
      return null;
    }
  }

  const handleSelectImage = (selectedAssets) => {
    if (!selectedAssets) return;

    const prevImages = images;    // ditto

    // normalize to an array
    const selectedArray = Array.isArray(selectedAssets)
      ? selectedAssets
      : [selectedAssets];

    // 2) build items WITH a stable `order` property:
    const newItems = selectedArray.map((asset, index) => {
      const code = generateRandomCode();
      return {
        url: asset.imageUrl,
        id: asset.idAsset,
        file: null,
        type: 'newAsset',
        code,
        previewUrl: asset.imageUrl,
        // uses the lengths we captured, plus the index in this batch
        order: prevImages.length + index + 1,
      };
    });

    // 3) split into images vs. files‐to‐add payloads:
    const newImages = newItems.map(item => ({
      url: item.url,
      id: item.id,
      file: item.file,
      type: item.type,
      code: item.code,
      order: item.order,
    }));

    // note the different name here—no shadowing of `newFiles`!
    const newFilesToAdd = newItems.map(item => ({
      previewUrl: item.previewUrl,
      file: item.file,
      id: item.id,
      code: item.code,
      order: item.order,
    }));

    // now you can safely set your states:
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




  // 4) Fetch existing images from the server (already uploaded)
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
        file: null, // no local file for server-stored images
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

      <ModalAsset
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectImage={handleSelectImage}
        selectType="multiple"
        partName={props.partName}
        length={images.length}
      />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex-grow text-center">
          {props.number}. {props.title} (Max. 5 Foto)
        </h2>
        <Button id="btn-asset" onClick={() => setIsModalOpen(true)}>
          <FaImages className="text-lg" />
        </Button>
      </div>
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
          {/* Responsive grid container */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {images.length > 0 ? (
              images.map((image) => (
                <SortableItem
                  key={image.id ?? image.url ?? image.code}
                  item={image}
                  // pass all three args here:
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
        <Button onClick={() => fileInputRef.current.click()} disabled={uploading}>
          {images.length > 0 ? "Ganti Foto" : "Upload Photos"}
        </Button>
        <Button
          onClick={handleUploadClick}
          disabled={uploading || (images.length === 0 && newFiles.length === 0)}
        >
          {uploading ? "Uploading..." : "Selanjutnya"}
        </Button>
      </div>
    </div>
  );
};

export default StepJ;