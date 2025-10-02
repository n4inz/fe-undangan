// components/LoadingOverlay.js
import React from "react";

const LoadingOverlay = ({ progress }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="spinner"></div> {/* Replace with your spinner component */}
      <div className="text-white text-xl ml-4">
        Uploading
        <span className="dot blink">.</span>
        <span className="dot blink delay-200">.</span>
        <span className="dot blink delay-400">.</span>
        <div className="mt-2">
          <span className="text-lg">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
