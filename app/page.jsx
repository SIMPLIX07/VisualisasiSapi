import {
  getSheetData,
  countUniqueShips,
  sumTotalSapi,
  groupByPerusahaan,
  getUniquePetugas,
  formatNumber,
  formatDate,
} from '@/lib/googleSheets';
import Dashboard from './components/Dashboard';

export const dynamic = 'force-dynamic';

/**
 * Halaman utama SI BOS Q.
 *
 * Menggunakan Next.js Server Component untuk mengambil data dari Google Sheets
 * di sisi server (bukan di client), sehingga:
 * 1. Credentials Google Service Account tidak terekspos ke browser
 * 2. Halaman bisa di-cache dan lebih cepat
 * 3. Deploy di Vercel berfungsi sebagai Serverless Function
 *
 * Ini menggantikan DashboardController.php di Laravel.
 */
export const metadata = {
  title: 'SI BOS Q - Sistem Informasi Bongkar Sapi Karantina Lampung',
  description:
    'Dashboard Sistem Informasi Gabungan Pemasukan Kapal dan Petugas Karantina - BKHIT Lampung',
  keywords: ['karantina', 'sapi', 'lampung', 'BKHIT', 'SI BOS Q', 'visualisasi'],
};

export default async function HomePage() {
  let data = [];
  let summary = {
    jumlahKapal: 0,
    jumlahKapalFormatted: '0',
    jumlahSapi: 0,
    jumlahSapiFormatted: '0',
  };
  let perusahaan = [];
  let petugas = [];
  let error = null;

  try {
    const rawData = await getSheetData();

    // Proses data: tambahkan field yang sudah diformat
    data = rawData.map((row) => ({
      ...row,
      tanggalFormatted: formatDate(row['Timestamp']),
      jumlahSapiFormatted: formatNumber(
        parseInt(String(row['Jumlah Sapi'] ?? '0').replace(/[.,]/g, ''), 10) || 0
      ),
    }));

    const jumlahKapal = countUniqueShips(rawData);
    const jumlahSapi = sumTotalSapi(rawData);

    summary = {
      jumlahKapal,
      jumlahKapalFormatted: formatNumber(jumlahKapal),
      jumlahSapi,
      jumlahSapiFormatted: formatNumber(jumlahSapi),
    };

    perusahaan = groupByPerusahaan(rawData).map((p) => ({
      ...p,
      totalFormatted: formatNumber(p.total),
    }));

    petugas = getUniquePetugas(rawData);
  } catch (err) {
    console.error('[Page Error] Gagal mengambil data dari Google Sheets:', err.message);
    error = err.message;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] font-sans">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded">
          <p className="text-red-700 text-sm font-medium">
            ⚠️ Gagal memuat data: {error}
          </p>
          <p className="text-red-500 text-xs mt-1">
            Pastikan environment variables sudah dikonfigurasi dengan benar.
          </p>
        </div>
      )}

      <Dashboard
        summary={summary}
        data={data}
        perusahaan={perusahaan}
        petugas={petugas}
      />
    </div>
  );
}
