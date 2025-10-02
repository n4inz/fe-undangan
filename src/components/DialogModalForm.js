import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import axios from "axios";
import { Loader2 } from "lucide-react";

export function DialogModalForm({ open, onOpenChange, index, row, formId, onDataUpdate }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null); // Store the actual file
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setImageFile(file); // Save the file for uploading
    }
  };

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    if (!imageFile) {
      alert("Please select an image to upload");
      return;
    }

    const formData = new FormData();
    formData.append("files", imageFile); // Append the image file to formData

    const dataObject = {
      id: row.id,
      idImage: row.idImage
    };
    // Append the serialized object to formData
    formData.append("data", JSON.stringify(dataObject));

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/update-image-order/` + formId, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Image uploaded successfully:", response.data);
      onOpenChange(false); // Close the dialog after successful upload
      onDataUpdate();
      setIsLoading(false)
    } catch (error) {
      console.error("Error uploading image:", error);
      setIsLoading(false)
    }
  };

  useEffect(() => {
    if (!open) {
      setSelectedImage(null); // Clear the selected image when the dialog is closed
      setImageFile(null); // Clear the file as well
    }
    console.log("row", row)
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ganti Foto</DialogTitle>
          <DialogDescription>
            Upload foto pengganti urutan {index} disini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="foto">Upload Foto</Label>
              <Input
                id="foto"
                type="file"
                name="images"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            {selectedImage && (
              <div className="mt-4">
                <Image
                  src={selectedImage}
                  alt="Selected Preview"
                  width={400}
                  height={400}
                  className="w-full h-[300px] object-cover rounded-lg"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                {/* <ClipLoader size={20} color="#fff" className="inline-block mr-2" /> */}
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submit
              </>
            ) : (
              'Submit'
            )}
              </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
