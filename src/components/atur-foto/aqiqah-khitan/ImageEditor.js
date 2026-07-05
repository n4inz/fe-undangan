'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { FaTimes, FaCheck, FaUndoAlt, FaRedoAlt, FaArrowLeft } from 'react-icons/fa';
import { Button } from '@/components/ui/button';

const ASPECT_PRESETS = [
  { value: null, label: 'Free' },
  { value: 0.5, label: '9:16' },
  { value: 0.75, label: '3:4' },
  { value: 1, label: '1:1' },
  { value: 1.33, label: '4:3' },
  { value: 1.5, label: '3:2' },
  { value: 1.77, label: '16:9' },
];

function getEditableImageSrc(src) {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src;

  try {
    const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://app.sewaundangan.com';
    const imageUrl = new URL(src, appOrigin);
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'https://api.sewaundangan.com');

    if (imageUrl.origin === apiUrl.origin) {
      return `/image-proxy${imageUrl.pathname}${imageUrl.search}`;
    }
  } catch (error) {
    console.warn('Unable to normalize image URL for editor', error);
  }

  return src;
}

function createCenteredCrop(mediaWidth, mediaHeight, aspect) {
  if (!mediaWidth || !mediaHeight) return undefined;

  // Free-form crop: start smaller and centered so mobile handles stay visible.
  if (!aspect) {
    return {
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    };
  }

  // Aspect crop: use the official helper approach.
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ImageEditor = ({ image, onSave, onCancel, idImage = null }) => {
  const editableImage = getEditableImageSrc(image);
  const [step, setStep] = useState('rotate');
  const [rotation, setRotation] = useState(0);
  const [rotatedImage, setRotatedImage] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(null);
  const [btnDone, setBtnDone] = useState(false);

  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const rotateLeft = () => setRotation((prev) => prev - 90);
  const rotateRight = () => setRotation((prev) => prev + 90);

  const applyRotation = async () => {
    return new Promise((resolve, reject) => {
      const imageObj = new Image();
      imageObj.crossOrigin = 'anonymous';
      imageObj.src = editableImage;

      imageObj.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Could not get canvas context'));

          const angle = rotation % 360;
          const radians = (angle * Math.PI) / 180;
          const sin = Math.abs(Math.sin(radians));
          const cos = Math.abs(Math.cos(radians));

          const newWidth = imageObj.width * cos + imageObj.height * sin;
          const newHeight = imageObj.width * sin + imageObj.height * cos;

          canvas.width = Math.ceil(newWidth);
          canvas.height = Math.ceil(newHeight);

          ctx.translate(newWidth / 2, newHeight / 2);
          ctx.rotate(radians);
          ctx.drawImage(imageObj, -imageObj.width / 2, -imageObj.height / 2);

          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch (error) {
          reject(error);
        }
      };

      imageObj.onerror = (err) => reject(err);
    });
  };

  const handleNext = async () => {
    try {
      const rotated = await applyRotation();
      setRotatedImage(rotated);
      setStep('crop');
    } catch (err) {
      console.error('Error applying rotation', err);
      setRotatedImage(editableImage);
      setStep('crop');
    }
  };

  const initCropFromImage = useCallback(
    (imgEl, nextAspect) => {
      if (!imgEl) return;

      const { naturalWidth, naturalHeight } = imgEl;
      const nextCrop = createCenteredCrop(naturalWidth, naturalHeight, nextAspect);

      setCrop(nextCrop);
      setCompletedCrop(null);
    },
    []
  );

  const onImageLoad = useCallback(
    (e) => {
      imgRef.current = e.currentTarget;
      initCropFromImage(e.currentTarget, aspectRatio ?? undefined);
    },
    [aspectRatio, initCropFromImage]
  );

  const handlePresetClick = (value) => {
    setAspectRatio(value);

    // Rebuild crop immediately after changing preset so the crop stays centered.
    const imgEl = imgRef.current;
    if (imgEl) {
      const nextCrop = createCenteredCrop(imgEl.naturalWidth, imgEl.naturalHeight, value ?? undefined);
      setCrop(nextCrop);
      setCompletedCrop(null);
    }
  };

  const onCropComplete = (c) => {
    setCompletedCrop(c);
  };

  const getCroppedImg = async () => {
    setBtnDone(true);

    try {
      if (!imgRef.current) {
        onSave(rotatedImage || editableImage || image);
        return;
      }

      const imageEl = imgRef.current;
      const canvas = canvasRef.current;

      if (!canvas) {
        onSave(rotatedImage || editableImage || image);
        return;
      }

      const cropData = completedCrop || {
        x: 0,
        y: 0,
        width: imageEl.width,
        height: imageEl.height,
      };

      const scaleX = imageEl.naturalWidth / imageEl.width;
      const scaleY = imageEl.naturalHeight / imageEl.height;

      const outputWidth = Math.max(1, Math.round(cropData.width * scaleX));
      const outputHeight = Math.max(1, Math.round(cropData.height * scaleY));

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onSave(rotatedImage || editableImage || image);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        imageEl,
        Math.round(cropData.x * scaleX),
        Math.round(cropData.y * scaleY),
        Math.round(cropData.width * scaleX),
        Math.round(cropData.height * scaleY),
        0,
        0,
        outputWidth,
        outputHeight
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            onSave(rotatedImage || editableImage || image);
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            onSave(reader.result);
          };
          reader.onerror = () => {
            onSave(rotatedImage || editableImage || image);
          };
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.9
      );
    } catch (e) {
      console.error('Error cropping image', e);
      onSave(rotatedImage || editableImage || image);
    } finally {
      setBtnDone(false);
    }
  };

  useEffect(() => {
    // When entering crop mode, reset crop so it is recalculated from the loaded image.
    if (step === 'crop') {
      setCrop(undefined);
      setCompletedCrop(null);
    }
  }, [step]);

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-800/80 backdrop-blur-sm z-10">
        <button
          onClick={onCancel}
          className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Cancel"
        >
          <FaTimes className="w-6 h-6 lg:w-4 lg:h-4" />
        </button>

        {step === 'rotate' ? (
          <Button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FaCheck className="w-6 h-6 lg:w-4 lg:h-4" />
            <span>Next</span>
          </Button>
        ) : (
          <div className="flex gap-4">
            <Button
              onClick={() => setStep('rotate')}
              className="p-2 text-white hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Back"
            >
              <FaArrowLeft className="w-6 h-6 lg:w-4 lg:h-4" />
            </Button>

            <Button
              onClick={getCroppedImg}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center gap-2"
              disabled={btnDone}
            >
              <FaCheck className="w-6 h-6 lg:w-4 lg:h-4" />
              <span>Done</span>
            </Button>
          </div>
        )}
      </div>

      {step === 'rotate' && (
        <div className="relative flex-1 w-full flex flex-col items-center justify-center p-4">
          <div className="mb-24">
            <img
              src={editableImage}
              alt="To rotate"
              style={{ transform: `rotate(${rotation}deg)` }}
              className="max-w-full max-h-[60vh] object-contain"
              crossOrigin="anonymous"
            />
          </div>

          <div className="absolute bottom-4 flex gap-6">
            <button
              onClick={rotateLeft}
              className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
              aria-label="Rotate left"
            >
              <FaUndoAlt className="w-6 h-6 lg:w-4 lg:h-4" />
            </button>

            <div className="w-12 h-12 flex items-center justify-center bg-gray-700 rounded-full text-white font-medium">
              {Math.abs(rotation % 360)}°
            </div>

            <button
              onClick={rotateRight}
              className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
              aria-label="Rotate right"
            >
              <FaRedoAlt className="w-6 h-6 lg:w-4 lg:h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'crop' && rotatedImage && (
        <>
          <div className="relative flex-1 w-full overflow-auto p-4 flex items-center justify-center">
            <div className="max-w-full max-h-full">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={onCropComplete}
                aspect={aspectRatio ?? undefined}
                className="max-w-full"
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100dvh - 200px)',
                }}
              >
                <img
                  ref={imgRef}
                  src={rotatedImage}
                  alt="To crop"
                  onLoad={onImageLoad}
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: 'calc(100dvh - 200px)',
                    objectFit: 'contain',
                  }}
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>
          </div>

<div className="bg-gray-800/80 backdrop-blur-sm p-4">
  <div className="w-full overflow-x-auto">
    <div className="flex w-max gap-2 px-2">
      {ASPECT_PRESETS.map((preset) => (
        <button
          key={preset.label}
          onClick={() => handlePresetClick(preset.value)}
          className={`shrink-0 px-3 py-1 rounded-full text-sm ${
            aspectRatio === preset.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  </div>
</div>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ImageEditor;
