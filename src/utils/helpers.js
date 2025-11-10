// Helper function to convert data URL to Blob
import axios from 'axios';

export function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export const sendNotification = async (id, phoneNumber, customMessage = null) => {
  try {
    if (!phoneNumber) throw new Error("Nomor telepon tidak boleh kosong");
    if (!id) throw new Error("Id form wajib diisi");

    // Use the raw phoneNumber in the URL (but encode for safe URL transport)
    const encodedNumber = encodeURIComponent(phoneNumber);

    // WA backend base URL (ensure this is set in .env)
    const waBase = (process.env.NEXT_PUBLIC_WA_BOT_URL || "").replace(/\/$/, "");
    if (!waBase) throw new Error("Missing NEXT_PUBLIC_WA_BOT_URL environment variable");

    const apiUrl = `${waBase}/api/send-notif/${encodedNumber}`;

    // Build link to app: prefer NEXT_PUBLIC_MAIN_URL, fallback to window.location.origin if available
    const mainBase =
      process.env.NEXT_PUBLIC_MAIN_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const cleanMainBase = mainBase ? String(mainBase).replace(/\/$/, "") : "";

    // Use raw phoneNumber in the link (URL-encoded to be URL-safe)
    const linkFoto = cleanMainBase
      ? `${cleanMainBase}/forms/${id}/${phoneNumber}/atur-foto`
      : `${id}/${phoneNumber}`;

    const linkEdit = cleanMainBase
      ? `${cleanMainBase}/forms/${id}/${phoneNumber}/atur-foto`
      : `${id}/${phoneNumber}`;

    const payloadMessage =
      customMessage ??
      `Terima kasih telah mengisi form undangan digital di sewaundangan. Silakan mengatur foto Anda di link ini:\n
      Edit Data:\n${linkFoto}
      \n\n
      Edit Data:\n${linkEdit}`;

    const response = await axios.post(
      apiUrl,
      { message: payloadMessage },
      { withCredentials: true } // remove if you don't need cookies/auth
    );

    if (response.status === 200 && response.data?.success) {
      return { data: response.data, error: null };
    }

    return { data: null, error: response.data?.message || "Gagal mengirim pesan" };
  } catch (error) {
    console.error("❌ Error sendNotification:", error);

    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Terjadi kesalahan tidak diketahui";

    return { data: null, error: backendMessage };
  }
};