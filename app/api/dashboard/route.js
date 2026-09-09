import { NextResponse } from 'next/server';
import {
  getSheetData,
  countUniqueShips,
  sumTotalSapi,
  groupByPerusahaan,
  getUniquePetugas,
  formatNumber,
  formatDate,
} from '@/lib/googleSheets';

/**
 * GET /api/dashboard
 * Mengambil dan memproses data dari Google Sheets lalu mengembalikan JSON
 * yang siap dikonsumsi oleh halaman dashboard.
 */
export async function GET() {
  try {
    const rawData = await getSheetData();

    const data = rawData.map((row) => ({
      ...row,
      // Format tanggal di sisi server
      tanggalFormatted: formatDate(row['Timestamp']),
      // Format jumlah sapi yang sudah bersih
      jumlahSapiFormatted: formatNumber(
        parseInt(String(row['Jumlah Sapi'] ?? '0').replace(/[.,]/g, ''), 10) || 0
      ),
    }));

    const jumlahKapal = countUniqueShips(rawData);
    const jumlahSapi = sumTotalSapi(rawData);
    const perusahaan = groupByPerusahaan(rawData).map((p) => ({
      ...p,
      totalFormatted: formatNumber(p.total),
    }));
    const petugas = getUniquePetugas(rawData);

    return NextResponse.json({
      success: true,
      data,
      summary: {
        jumlahKapal,
        jumlahKapalFormatted: formatNumber(jumlahKapal),
        jumlahSapi,
        jumlahSapiFormatted: formatNumber(jumlahSapi),
      },
      perusahaan,
      petugas,
    });
  } catch (error) {
    console.error('[Dashboard API Error]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
