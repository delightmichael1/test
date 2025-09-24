import React from "react";
import Cropper from "react-easy-crop";

interface EasyCropProps {
  image: string;
  aspect: number;
  setCroppedAreaPixels: React.Dispatch<any>;
}

const EasyCrop = ({ image, aspect, setCroppedAreaPixels }: EasyCropProps) => {
  const [zoom, setZoom] = React.useState<number>(1);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });

  const onCropComplete = React.useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [setCroppedAreaPixels]
  );

  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-2">
      <Cropper
        image={image}
        crop={crop}
        zoom={zoom}
        showGrid={true}
        aspect={aspect}
        onCropChange={setCrop}
        onCropComplete={onCropComplete}
        onZoomChange={setZoom}
        cropShape="rect"
        restrictPosition={true}
      />
    </div>
  );
};

export default EasyCrop;
