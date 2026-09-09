import { google } from 'googleapis';

/**
 * Menginisialisasi Google Sheets client menggunakan Service Account.
 * Mendukung dua cara autentikasi:
 * 1. Environment variable GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 (untuk production/Vercel)
 * 2. File JSON lokal di path tertentu (untuk development)
 */
function getAuthClient() {
  const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;

  if (credentialsBase64) {
    // Production (Vercel): decode base64 credentials dari environment variable
    const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
    const credentials = JSON.parse(credentialsJson);

    return new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  }

  // Development lokal: gunakan file credentials/service-account.json
  // File ini ada di .gitignore dan tidak akan ter-commit ke repository
  const path = require('path');
  const fs = require('fs');
  const localCredPath = path.join(process.cwd(), 'credentials', 'service-account.json');

  if (fs.existsSync(localCredPath)) {
    const credentials = JSON.parse(fs.readFileSync(localCredPath, 'utf-8'));
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  }

  // Fallback: Application Default Credentials (jika sudah setup gcloud CLI)
  return new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

/**
 * Mengambil data dari Google Sheets dan mengembalikannya sebagai array of objects.
 * Baris pertama dianggap sebagai header kolom.
 */
export async function getSheetData() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const range = process.env.GOOGLE_SHEETS_RANGE || 'A1:I1000';

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_ID tidak diset di environment variables');
  }

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values || [];

  if (rows.length === 0) return [];

  const headers = rows[0];
  const data = rows.slice(1).map((row) => {
    // Pad row agar panjangnya sama dengan headers
    const paddedRow = [...row];
    while (paddedRow.length < headers.length) {
      paddedRow.push(null);
    }

    return headers.reduce((obj, header, index) => {
      obj[header] = paddedRow[index] ?? null;
      return obj;
    }, {});
  });

  return data;
}

/**
 * Menghitung jumlah kapal unik dari data.
 */
export function countUniqueShips(data) {
  const unique = new Set(
    data.map((row) => row['Nama Kapal']).filter(Boolean)
  );
  return unique.size;
}

/**
 * Menghitung total jumlah sapi dari semua baris.
 */
export function sumTotalSapi(data) {
  return data.reduce((total, row) => {
    const val = String(row['Jumlah Sapi'] ?? '0').replace(/\./g, '').replace(/,/g, '');
    return total + (parseInt(val, 10) || 0);
  }, 0);
}

/**
 * Mengelompokkan data per perusahaan dan menjumlahkan sapi-nya.
 * Diurutkan dari terbesar ke terkecil.
 */
export function groupByPerusahaan(data) {
  const map = {};

  data.forEach((row) => {
    const nama = row['Nama Perusahaan'];
    if (!nama) return;

    const jumlah = parseInt(
      String(row['Jumlah Sapi'] ?? '0').replace(/[.,]/g, ''),
      10
    ) || 0;

    map[nama] = (map[nama] || 0) + jumlah;
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([nama, total]) => ({ nama, total }));
}

/**
 * Mengambil daftar petugas pemeriksa kapal yang unik.
 */
export function getUniquePetugas(data) {
  return [...new Set(
    data.map((row) => row['Petugas Pemeriksa Kapal']).filter(Boolean)
  )];
}

/**
 * Format angka ke format Indonesia (pemisah ribuan dengan titik).
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format tanggal dari Timestamp Google Sheets ke format dd/mm/yyyy.
 */
export function formatDate(timestamp) {
  if (!timestamp) return '-';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return timestamp;
  }
}
