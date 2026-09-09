/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Izinkan gambar dari domain eksternal jika diperlukan
    remotePatterns: [],
  },
  // Pastikan googleapis hanya berjalan di server, bukan di browser
  serverExternalPackages: ['googleapis'],
};

export default nextConfig;
