// utils/messageTemplates.js

const messageTemplates = [
  `Halo, terima kasih sudah melengkapi form undangan digital di sewaundangan. Atur foto Anda lewat link berikut:
*Edit Foto:*
{{linkFoto}}

*Edit Data:*
{{linkEdit}}

_⚠️ Demi keamanan, jangan bagikan link ini kepada orang lain._`,

  `Terima kasih telah mengisi form undangan digital sewaundangan. Silakan atur tampilan foto Anda di:
*Edit Foto:*
{{linkFoto}}

*Edit Data:*
{{linkEdit}}

_⚠️ Jaga kerahasiaan link ini agar data Anda tetap aman._`,

  `Hai, terima kasih sudah submit form undangan digital di sewaundangan. Gunakan link di bawah untuk mengatur foto Anda:
*Edit Foto:*
{{linkFoto}}

*Edit Data:*
{{linkEdit}}

_⚠️ Link ini bersifat pribadi, mohon tidak dibagikan._`,

  `Terima kasih! Form undangan digital Anda di sewaundangan berhasil kami terima. Atur foto dan data Anda di sini:
*Edit Foto:*
{{linkFoto}}

*Edit Data:*
{{linkEdit}}

_⚠️ Privasi Anda penting. Jangan sebarkan link ini._`,

  `Kami ucapkan terima kasih karena telah mengisi form undangan digital sewaundangan. Segera atur foto Anda melalui:
*Edit Foto:*
{{linkFoto}}

*Edit Data:*
{{linkEdit}}

_⚠️ Untuk menjaga privasi, jangan bagikan link ini ke siapa pun._`,

  `Terima kasih sudah mendaftarkan undangan digital di sewaundangan. Silakan lanjutkan dengan mengatur foto Anda di:
*Edit Foto:*
{{linkFoto}}

*Edit Data:*
{{linkEdit}}

_⚠️ Hanya Anda yang boleh mengakses link ini, jaga kerahasiaannya._`,

  `Form undangan digital Anda di sewaundangan sudah tercatat, terima kasih! Atur foto sekarang lewat link:
*Edit Foto:*
{{linkFoto}}

*Edit Data:*
{{linkEdit}}

_⚠️ Jangan bagikan link ini demi keamanan data pribadi._`,

  `Terima kasih telah mempercayakan undangan digital Anda kepada sewaundangan. Kini saatnya mengatur foto melalui:
*Edit Foto:*
{{linkFoto}}

*Edit Data:*
{{linkEdit}}

_⚠️ Link bersifat rahasia, simpan baik-baik dan jangan disebarkan._`,

  `Halo! Terima kasih sudah mengirimkan form undangan digital di sewaundangan. Atur foto dan cek kembali data Anda di:
*Edit Foto:*
{{linkFoto}}

*Edit Data:*
{{linkEdit}}

_⚠️ Ingat, jangan bagikan link ini untuk melindungi informasi Anda._`,

  `Terima kasih telah mengisi data undangan digital sewaundangan. Langkah selanjutnya, atur foto Anda di tautan ini:
*Edit Foto:*
{{linkFoto}}

*Edit Data:*
{{linkEdit}}

_⚠️ Demi kenyamanan bersama, pastikan link ini hanya diakses oleh Anda._`,
];

/**
 * Mengembalikan satu pesan acak dari 10 variasi.
 * @param {string} linkFoto - URL untuk edit foto
 * @param {string} linkEdit - URL untuk edit data
 * @returns {string} Pesan lengkap yang sudah diisi link
 */
export function getRandomMessage(linkFoto, linkEdit) {
  const randomIndex = Math.floor(Math.random() * messageTemplates.length);
  return messageTemplates[randomIndex]
    .replaceAll("{{linkFoto}}", linkFoto)
    .replaceAll("{{linkEdit}}", linkEdit);
}