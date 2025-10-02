// components/LoadingSpinner.js
export default function LoadingSpinner() {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="border-t-4 border-blue-500 border-solid rounded-full w-16 h-16 border-t-transparent animate-spin"></div>
      </div>
    );
  }
  