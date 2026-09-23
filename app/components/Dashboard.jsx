'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DatePickerModal from './DatePickerModal';

function getDateKey(value) {
  if (!value) return null;

  const text = String(value).trim();

  // Format ISO: 2026-09-03 atau 2026-09-03T...
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Format: 03/09/2026
  const slashMatch = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
  );

  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2].padStart(
      2,
      '0'
    )}-${slashMatch[1].padStart(2, '0')}`;
  }

  // Format Date yang sudah valid
  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return [
      parsed.getFullYear(),
      String(parsed.getMonth() + 1).padStart(2, '0'),
      String(parsed.getDate()).padStart(2, '0'),
    ].join('-');
  }

  return null;
}

function getTimestampValue(value) {
  if (!value) return NaN;

  const text = String(value).trim();
  const slashMatch = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );

  if (slashMatch) {
    return new Date(
      Number(slashMatch[3]),
      Number(slashMatch[2]) - 1,
      Number(slashMatch[1]),
      Number(slashMatch[4] || 0),
      Number(slashMatch[5] || 0),
      Number(slashMatch[6] || 0)
    ).getTime();
  }

  return new Date(value).getTime();
}

function formatDateIndonesia(dateKey) {
  if (!dateKey) return '';

  const [year, month, day] = dateKey.split('-');

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatNumberID(number) {
  return new Intl.NumberFormat('id-ID').format(number);
}

function getCellValue(row, columnName) {
  if (row[columnName] !== undefined) return row[columnName];

  const normalize = (value) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const target = normalize(columnName);
  const entry = Object.entries(row).find(([key]) => {
    const normalizedKey = normalize(key);
    return normalizedKey === target || (
      target.includes('disinfeksialatangkut') &&
      normalizedKey.includes('disinfeksialatangkut')
    );
  });

  return entry?.[1] ?? '';
}

function hasValue(value) {
  return String(value ?? '').trim() !== '';
}

function normalizeFilterValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function parseQuantity(value) {
  return parseInt(String(value ?? '0').replace(/[.,]/g, ''), 10) || 0;
}

function groupChartData(rows, columnName) {
  const totals = new Map();

  rows.forEach((row) => {
    const name = String(getCellValue(row, columnName) || 'Tidak diketahui').trim();
    const quantity = parseQuantity(getCellValue(row, 'Jumlah Sapi'));
    totals.set(name, (totals.get(name) || 0) + quantity);
  });

  const sorted = [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  if (sorted.length <= 10) return sorted;

  const topTen = sorted.slice(0, 10);
  const otherTotal = sorted
    .slice(10)
    .reduce((total, item) => total + item.total, 0);

  return [...topTen, { name: 'Other', total: otherTotal }];
}

function ChartBars({ items, color }) {
  if (items.length === 0) {
    return <p className="py-12 text-center text-xs text-gray-400">Belum ada data grafik.</p>;
  }

  const maximum = Math.max(...items.map((item) => item.total), 1);

  return (
    <div className="flex h-64 items-end gap-2 overflow-x-auto px-2 pb-8 pt-4">
      {items.map((item) => (
        <div key={item.name} className="flex h-full min-w-[68px] flex-1 flex-col items-center justify-end gap-2">
          <span className="text-[10px] font-bold text-gray-700">{formatNumberID(item.total)}</span>
          <div className="flex h-44 w-full items-end justify-center">
            <div
              className="w-full max-w-14 rounded-t bg-[#1d4ed8] transition-all duration-300"
              style={{ height: `${Math.max((item.total / maximum) * 100, 3)}%`, backgroundColor: color }}
              title={`${item.name}: ${formatNumberID(item.total)}`}
            />
          </div>
          <span className="w-full truncate text-center text-[10px] text-gray-600" title={item.name}>
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function DisinfectionChart({ yes, no }) {
  const total = yes + no;
  const yesPercentage = total === 0 ? 0 : (yes / total) * 100;

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-5 sm:flex-row">
      <div
        className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(#0f766e ${yesPercentage}%, #f59e0b 0)` }}
        aria-label={`Disinfeksi Ya ${formatNumberID(yes)}, Tidak ${formatNumberID(no)}`}
      >
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
          <span className="text-xl font-bold text-[#0d1b3e]">{formatNumberID(total)}</span>
          <span className="text-[10px] text-gray-500">data</span>
        </div>
      </div>
      <div className="space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-teal-700" />
          <span className="font-bold text-gray-800">Ya: <strong>{formatNumberID(yes)}</strong> ({yesPercentage.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="font-bold text-gray-800">Tidak: <strong>{formatNumberID(no)}</strong> ({(100 - yesPercentage).toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
}

const DETAIL_ITEMS_PER_PAGE = 15;

export default function Dashboard({
  summary,
  data,
  perusahaan,
  petugas,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Rentang tanggal dari DatePickerModal
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [shipName, setShipName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [detailNopolFilter, setDetailNopolFilter] = useState('');
  const [detailPage, setDetailPage] = useState(1);

  useEffect(() => {
    setDetailPage(1);
  }, [startDate, endDate, shipName, companyName, detailNopolFilter]);

  /*
   * =============================================================
   * FILTER DATA BERDASARKAN RENTANG TANGGAL
   * =============================================================
   *
   * Jika startDate & endDate sudah dipilih, tampilkan hanya
   * data yang Timestamp-nya berada dalam rentang tersebut.
   * Jika belum dipilih, tampilkan seluruh data.
   */
  const filteredData = useMemo(() => {
    let rows = data;

    if (startDate && endDate) {
      const startKey = getDateKey(startDate);
      const endKey = getDateKey(endDate);

      if (startKey && endKey) {
        rows = data.filter((row) => {
          const rowDate = getDateKey(row['Timestamp']);
          if (!rowDate) return false;
          return rowDate >= startKey && rowDate <= endKey;
        });
      }
    }

    const normalizedShipName = normalizeFilterValue(shipName);
    const normalizedCompanyName = normalizeFilterValue(companyName);

    if (normalizedShipName || normalizedCompanyName) {
      rows = rows.filter((row) => {
        const rowShipName = normalizeFilterValue(
          getCellValue(row, 'Nama Kapal')
        );
        const rowCompanyName = normalizeFilterValue(
          getCellValue(row, 'Nama Perusahaan')
        );

        return (
          (!normalizedShipName || rowShipName.includes(normalizedShipName)) &&
          (!normalizedCompanyName || rowCompanyName.includes(normalizedCompanyName))
        );
      });
    }

    return rows
      .map((row, index) => ({
        row,
        index,
        timestamp: getTimestampValue(row['Timestamp']),
      }))
      .sort((a, b) => {
        const aInvalid = Number.isNaN(a.timestamp);
        const bInvalid = Number.isNaN(b.timestamp);

        if (aInvalid && bInvalid) return a.index - b.index;
        if (aInvalid) return 1;
        if (bInvalid) return -1;
        return a.timestamp - b.timestamp;
      })
      .map(({ row }) => row);
  }, [data, startDate, endDate, shipName, companyName]);

  /*
   * =============================================================
   * SUMMARY BERDASARKAN TANGGAL YANG DIPILIH
   * =============================================================
   */
  const filteredSummary = useMemo(() => {
    const uniqueShips = new Set(
      filteredData
        .map((row) => row['Nama Kapal'])
        .filter(Boolean)
    );

    const totalSapi = filteredData.reduce(
      (total, row) => {
        const value = String(
          row['Jumlah Sapi'] ?? '0'
        ).replace(/[.,]/g, '');

        return total + (parseInt(value, 10) || 0);
      },
      0
    );

    return {
      jumlahKapalFormatted:
        formatNumberID(uniqueShips.size),

      jumlahSapiFormatted:
        formatNumberID(totalSapi),
    };
  }, [filteredData]);

  /*
   * =============================================================
   * PERUSAHAAN BERDASARKAN TANGGAL YANG DIPILIH
   * =============================================================
   */
  const filteredPerusahaan = useMemo(() => {
    return filteredData
      .filter((row) => hasValue(getCellValue(row, 'Nama Perusahaan')))
      .map((row) => {
        const jumlah = getCellValue(row, 'Jumlah Sapi');
        const total = parseInt(
          String(jumlah ?? '').replace(/[.,]/g, ''),
          10
        );

        return {
          nama: getCellValue(row, 'Nama Perusahaan'),
          totalFormatted: hasValue(jumlah) && !Number.isNaN(total)
            ? formatNumberID(total)
            : '',
        };
      });
  }, [filteredData]);

  /*
   * =============================================================
   * PETUGAS BERDASARKAN TANGGAL YANG DIPILIH
   * =============================================================
   */
  const filteredPetugas = useMemo(() => {
    const latestRow = filteredData.reduce((latest, row) => {
      const rowTimestamp = getTimestampValue(row['Timestamp']);

      if (Number.isNaN(rowTimestamp)) return latest;
      if (!latest || rowTimestamp > latest.timestamp) {
        return { row, timestamp: rowTimestamp };
      }

      return latest;
    }, null);

    return [
      latestRow?.row['Petugas Pemeriksa Kapal'],
    ].filter(Boolean);
  }, [filteredData]);

  const [isChartsOpen, setIsChartsOpen] = useState(false);

  const chartData = useMemo(() => {
    const disinfection = filteredData.reduce((result, row) => {
      const value = normalizeFilterValue(
        getCellValue(row, 'Dilakukan Disinfeksi Alat Angkut?')
      );

      if (value === 'ya' || value === 'yes') result.yes += 1;
      else result.no += 1;
      return result;
    }, { yes: 0, no: 0 });

    return {
      companies: groupChartData(filteredData, 'Nama Perusahaan'),
      animals: groupChartData(filteredData, 'Jenis Hewan'),
      disinfection,
    };
  }, [filteredData]);

  const detailRows = useMemo(() => {
    const normalizedNopolFilter = normalizeFilterValue(detailNopolFilter);

    return filteredData.filter((row) => {
      const hasData = Object.entries(row).some(
        ([key, value]) =>
          key !== 'tanggalFormatted' &&
          key !== 'jumlahSapiFormatted' &&
          hasValue(value)
      );
      const nopol = normalizeFilterValue(
        getCellValue(row, 'Nopol Kendaraan')
      );

      return hasData && (
        !normalizedNopolFilter || nopol.includes(normalizedNopolFilter)
      );
    });
  }, [filteredData, detailNopolFilter]);

  const detailTotalPages = Math.ceil(
    detailRows.length / DETAIL_ITEMS_PER_PAGE
  );

  const paginatedDetailRows = detailRows.slice(
    (detailPage - 1) * DETAIL_ITEMS_PER_PAGE,
    detailPage * DETAIL_ITEMS_PER_PAGE
  );

  return (
    <>
      {/* ============================================================= */}
      {/* HEADER / HERO */}
      {/* ============================================================= */}
      <header
        className="relative h-64 md:h-80 flex flex-col items-center justify-center text-white"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("/assets/img/Background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Navigation */}
        <nav className="absolute top-0 w-full px-6 py-4 flex justify-between items-center bg-black/20">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
              <Image
                src="/assets/img/Logo_Badan_Karantina_Indonesia.png"
                alt="BKHIT Lampung Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>

            <span className="font-semibold tracking-wide">
              BKHIT Lampung
            </span>
          </div>

          <div className="flex items-center space-x-6 text-sm">
            <Link
              href="/"
              className="hover:text-gray-300 transition"
            >
              Home
            </Link>

            <Link
              href="/about"
              className="hover:text-gray-300 transition"
            >
              About us
            </Link>

            <button
              aria-label="Search"
              className="hover:text-gray-300 transition"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
          </div>
        </nav>

        {/* Hero Title */}
        <div className="text-center mt-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">
            SI BOS Q
          </h1>

          <p className="text-sm md:text-base font-medium opacity-90">
            Sistem Informasi Bongkar Sapi Karantina Lampung
          </p>
        </div>
      </header>

      {/* ============================================================= */}
      {/* MAIN DASHBOARD */}
      {/* ============================================================= */}
      <main className="flex-grow flex flex-col items-center py-10 px-4">
        <div
          className="bg-white rounded-lg w-full max-w-5xl border border-gray-200 overflow-hidden"
          style={{
            boxShadow:
              '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
          }}
        >
          {/* Dashboard Header Bar */}
          <div className="bg-[#0d1b3e] text-white p-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-md flex-shrink-0">
                <Image
                  src="/assets/img/SIBOSQ-circle.png"
                  alt="SI BOS Q Logo"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>

              <h2 className="text-xl font-bold tracking-wide">
                SI BOS Q
              </h2>
            </div>

            {/* FILTER RENTANG TANGGAL */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-gray-800 text-xs py-1 px-3 rounded border border-gray-300 outline-none flex items-center space-x-1 hover:bg-gray-50 transition"
            >
              <span>
                {startDate && endDate
                  ? `${startDate.toLocaleDateString(
                      'id-ID'
                    )} - ${endDate.toLocaleDateString(
                      'id-ID'
                    )}`
                  : 'Pilih rentang tanggal...'}
              </span>

              <span className="material-symbols-outlined text-[14px]">
                calendar_today
              </span>
            </button>
          </div>

          {/* Subheader */}
          <div className="px-6 py-3 border-b border-gray-200 flex justify-between text-xs text-gray-600 font-medium">
            <span>
              Sistem Informasi Gabungan Pemasukan Kapal &amp;
              Petugas Karantina
            </span>

            <span>BKHIT Lampung</span>
          </div>

          <div className="p-6 space-y-6">

            {/* ======================================================= */}
            {/* GRAFIK */}
            {/* ======================================================= */}
            <section className="overflow-hidden rounded-lg border-2 border-gray-200">
              <button
                type="button"
                onClick={() => setIsChartsOpen((isOpen) => !isOpen)}
                aria-expanded={isChartsOpen}
                className="flex w-full items-center justify-between bg-gray-100 px-4 py-3 text-left transition hover:bg-gray-200"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <span className="text-lg" aria-hidden="true">📊</span>
                  Grafik
                </span>
                <span className="text-lg text-gray-500" aria-hidden="true">{isChartsOpen ? '−' : '+'}</span>
              </button>

              {isChartsOpen && (
                <div className="grid grid-cols-1 gap-5 p-4 xl:grid-cols-2">
                  <article className="rounded border border-gray-200 bg-white p-3">
                    <h3 className="text-sm font-bold text-gray-800">Perusahaan &amp; Jumlah Sapi</h3>
                    <ChartBars items={chartData.companies} color="#1d4ed8" />
                  </article>

                  <article className="rounded border border-gray-200 bg-white p-3">
                    <h3 className="text-sm font-bold text-gray-800">Status Disinfeksi</h3>
                    <DisinfectionChart {...chartData.disinfection} />
                  </article>

                  <article className="rounded border border-gray-200 bg-white p-3 xl:col-span-2">
                    <h3 className="text-sm font-bold text-gray-800">Jenis Hewan &amp; Jumlah</h3>
                    <ChartBars items={chartData.animals} color="#0f766e" />
                  </article>
                </div>
              )}
            </section>

            {/* ======================================================= */}
            {/* METRIC CARDS */}
            {/* ======================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* RENTANG TANGGAL AKTIF */}
              <div className="bg-gray-50 border border-gray-200 rounded p-4 flex flex-col justify-center items-center text-center space-y-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Rentang Tanggal
                </span>

                {startDate && endDate ? (
                  <>
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-xs text-gray-400">Dari</span>
                      <span className="text-sm font-bold text-[#0d1b3e]">
                        {formatDateIndonesia(getDateKey(startDate))}
                      </span>
                    </div>

                    <div className="w-8 h-px bg-gray-300" />

                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-xs text-gray-400">Sampai</span>
                      <span className="text-sm font-bold text-[#0d1b3e]">
                        {formatDateIndonesia(getDateKey(endDate))}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setStartDate(null);
                        setEndDate(null);
                        setShipName('');
                        setCompanyName('');
                      }}
                      className="text-[10px] text-red-400 hover:text-red-600 transition mt-1 underline"
                    >
                      Reset filter
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    Klik tombol kalender di atas untuk memfilter data
                  </span>
                )}
              </div>

              {/* Total Kapal */}
              <div className="bg-gray-100 border border-gray-200 rounded p-4 flex flex-col justify-center items-center text-center">
                <div className="mb-2">
                  <span
                    className="material-symbols-outlined text-[#0d1b3e]"
                    style={{ fontSize: '32px' }}
                  >
                    directions_boat
                  </span>
                </div>

                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Jumlah Total Kapal
                </span>

                <span className="text-2xl font-bold text-gray-800">
                  {filteredSummary.jumlahKapalFormatted}
                </span>

                <span className="text-xs text-gray-500">
                  kapal
                </span>
              </div>

              {/* Total Sapi */}
              <div className="bg-gray-100 border border-gray-200 rounded p-4 flex flex-col justify-center items-center text-center">
                <div className="mb-2 text-yellow-600 text-2xl">
                  🐄
                </div>

                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Jumlah Total Sapi
                </span>

                <span className="text-2xl font-bold text-gray-800">
                  {filteredSummary.jumlahSapiFormatted}
                </span>

                <span className="text-xs text-gray-500">
                  ekor
                </span>
              </div>
            </div>

            {/* ======================================================= */}
            {/* PEMERIKSAAN KAPAL */}
            {/* ======================================================= */}
            <section className="border-2 border-gray-200 rounded-lg">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center space-x-2 rounded-t-lg">
                <span className="text-lg">📋</span>

                <h3 className="font-bold text-gray-800 text-sm">
                  Pemeriksaan Kapal
                </h3>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Informasi Kapal */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-700">
                    Informasi Kapal
                  </h4>

                  <div className="max-h-52 overflow-y-auto border border-gray-200 rounded">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#0d1b3e] text-white">
                        <tr>
                          <th className="px-3 py-2 border-r border-[#0d1b3e]">
                            Nama Kapal
                          </th>

                          <th className="px-3 py-2 text-center">
                            Port
                          </th>
                        </tr>
                      </thead>

                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-3 py-4 text-center text-gray-400"
                            >
                              Belum ada data kapal.
                            </td>
                          </tr>
                        ) : (
                          filteredData
                            .filter((row) =>
                              hasValue(getCellValue(row, 'Nama Kapal')) ||
                              hasValue(getCellValue(row, 'Nama Port'))
                            )
                            .map((row, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 border-r border-gray-100 text-gray-800 font-medium">
                                {getCellValue(row, 'Nama Kapal')}
                              </td>

                              <td className="px-3 py-2 text-center text-gray-600">
                                {getCellValue(row, 'Nama Port')}
                              </td>
                            </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] text-gray-400 italic">
                    * Data diambil langsung dari Google Sheets
                  </p>

                  {/* Petugas */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-700">
                      Petugas Pemeriksa Kapal
                    </h4>

                    <div className="bg-gray-100 border border-gray-200 rounded p-4 text-sm text-gray-700 text-center">
                      {filteredPetugas.length > 0
                        ? filteredPetugas.join(', ')
                        : '-'}
                    </div>
                  </div>
                </div>

                {/* Informasi Perusahaan */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-700">
                    Informasi Perusahaan Importir
                  </h4>

                  <div className="max-h-52 overflow-y-auto border border-gray-200 rounded">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#0d1b3e] text-white">
                        <tr>
                          <th className="px-3 py-2 border-r border-[#0d1b3e] text-center">
                            Perusahaan
                          </th>

                          <th className="px-3 py-2 text-center">
                            Jumlah Sapi
                          </th>
                        </tr>
                      </thead>

                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredPerusahaan.length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-3 py-4 text-center text-gray-400"
                            >
                              Belum ada data perusahaan.
                            </td>
                          </tr>
                        ) : (
                          filteredPerusahaan.map((p, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 border-r border-gray-100 text-center text-gray-800 font-medium">
                                {p.nama}
                              </td>

                              <td className="px-3 py-2 text-center text-gray-600">
                                {p.totalFormatted}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            {/* ======================================================= */}
            {/* PEMERIKSAAN KAPAL DETAIL */}
            {/* ======================================================= */}
            <section className="border-2 border-gray-200 rounded-lg">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center space-x-2 rounded-t-lg">
                <span className="text-lg">🧪</span>

                <h3 className="font-bold text-gray-800 text-sm">
                  Pemeriksaan Kapal Detail
                </h3>
              </div>

              <div className="p-4">
                <div className="mb-4 max-w-sm">
                  <label
                    htmlFor="detail-nopol-filter"
                    className="mb-1 block text-xs font-semibold text-gray-700"
                  >
                    Filter Nopol Kendaraan
                  </label>
                  <input
                    id="detail-nopol-filter"
                    type="search"
                    value={detailNopolFilter}
                    onChange={(event) => setDetailNopolFilter(event.target.value)}
                    placeholder="Ketik nopol kendaraan"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-xs text-gray-800 outline-none transition focus:border-[#0d1b3e] focus:ring-1 focus:ring-[#0d1b3e]"
                  />
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="bg-[#0d1b3e] text-white">
                      <tr>
                        <th className="px-3 py-2 border-r border-[#0d1b3e]">
                          Tanggal
                        </th>

                        <th className="px-3 py-2 border-r border-[#0d1b3e]">
                          Nama Kapal
                        </th>

                        <th className="px-3 py-2 border-r border-[#0d1b3e]">
                          Port
                        </th>

                        <th className="px-3 py-2 border-r border-[#0d1b3e]">
                          Perusahaan
                        </th>

                        <th className="px-3 py-2 border-r border-[#0d1b3e] text-center">
                          Jumlah Sapi
                        </th>

                        <th className="px-3 py-2 border-r border-[#0d1b3e]">
                          Petugas Pemeriksa Kapal
                        </th>

                        <th className="px-3 py-2 border-r border-[#0d1b3e]">
                          Jenis Hewan
                        </th>

                        <th className="px-3 py-2 border-r border-[#0d1b3e]">
                          Nopol Kendaraan
                        </th>

                        <th className="px-3 py-2 text-center">
                          Dilakukan Disinfeksi Alat Angkut?
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-100">
                      {detailRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-3 py-6 text-center text-gray-400"
                          >
                            Belum ada data dari Google Sheets.
                          </td>
                        </tr>
                      ) : (
                        paginatedDetailRows.map((row, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 border-r border-gray-100 text-gray-600">
                              {hasValue(getCellValue(row, 'Timestamp'))
                                ? row.tanggalFormatted
                                : ''}
                            </td>

                            <td className="px-3 py-2 border-r border-gray-100 text-gray-800 font-medium">
                              {getCellValue(row, 'Nama Kapal')}
                            </td>

                            <td className="px-3 py-2 border-r border-gray-100 text-gray-600">
                              {getCellValue(row, 'Nama Port')}
                            </td>

                            <td className="px-3 py-2 border-r border-gray-100 text-gray-600">
                              {getCellValue(row, 'Nama Perusahaan')}
                            </td>

                            <td className="px-3 py-2 border-r border-gray-100 text-center font-bold text-gray-800">
                              {hasValue(getCellValue(row, 'Jumlah Sapi'))
                                ? row.jumlahSapiFormatted
                                : ''}
                            </td>

                            <td className="px-3 py-2 border-r border-gray-100 text-gray-600">
                              {getCellValue(row, 'Petugas Pemeriksa Kapal')}
                            </td>

                            <td className="px-3 py-2 border-r border-gray-100 text-gray-600">
                              {getCellValue(row, 'Jenis Hewan')}
                            </td>

                            <td className="px-3 py-2 border-r border-gray-100 text-gray-600">
                              {getCellValue(row, 'Nopol Kendaraan')}
                            </td>

                            <td className="px-3 py-2 text-center text-gray-600">
                              {getCellValue(
                                row,
                                'Dilakukan Disinfeksi Alat Angkut?'
                              )}
                            </td>
                          </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>

                {detailTotalPages > 1 && (
                  <div className="flex items-center justify-between gap-4 mt-4 text-xs text-gray-600">
                    <span>
                      Halaman {detailPage} dari {detailTotalPages}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailPage((page) => page - 1)}
                        disabled={detailPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Sebelumnya
                      </button>

                      <button
                        type="button"
                        onClick={() => setDetailPage((page) => page + 1)}
                        disabled={detailPage === detailTotalPages}
                        className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* ============================================================= */}
        {/* ACTION BUTTONS & FOOTER LINKS */}
        {/* ============================================================= */}
        <div className="w-full max-w-3xl mt-12 mb-12 flex flex-col space-y-6">

          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSftx6V8qgZZaZD-2ORfTZ8i-hH9DP2RXUwqbp6y4cd22wVfsg/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#0d1b3e] hover:bg-opacity-90 text-white font-medium py-4 px-4 shadow transition duration-200 text-sm tracking-wide rounded-xl text-center"
          >
            1. Pengisian Google Form SIGAP-Karantina
          </a>

          <a
            href="https://docs.google.com/spreadsheets/d/1CrX6b7X0NaLspZfa9BhrhSjbi5JALkReNJXr9YXgUSw/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#0d1b3e] hover:bg-opacity-90 text-white font-medium py-4 px-4 shadow transition duration-200 text-sm tracking-wide rounded-xl text-center"
          >
            2. Database SIGAP-Karantina
          </a>

          <div className="pt-8 text-center">
            <p className="text-gray-800 font-medium mb-6">
              Karantina KUAT untuk Indonesia Hebat!
            </p>

            <div className="flex justify-center items-center space-x-4">

              <a
                href="https://karantinaindonesia.go.id/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/assets/img/Logo_Badan_Karantina_Indonesia.png"
                  alt="Badan Karantina Indonesia"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </a>

              <a
                href="https://www.instagram.com/karantinalampung?igsi=MWh3bHVkYnp5emprNQ=="
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/assets/img/instagram.png"
                  alt="Instagram"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </a>

              <a
                href="https://maps.app.goo.gl/MyWpqhiLCY7UDR547?g_st=iw"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/assets/img/Google_Maps_Logo_2020.svg.webp"
                  alt="Google Maps"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </a>

            </div>
          </div>
        </div>
      </main>

      {/* ============================================================= */}
      {/* DATE PICKER MODAL */}
      {/* ============================================================= */}
      <DatePickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialStartDate={startDate}
        initialEndDate={endDate}
        initialShipName={shipName}
        initialCompanyName={companyName}
        onApply={(start, end, selectedShipName, selectedCompanyName) => {
          setStartDate(start);
          setEndDate(end);
          setShipName(selectedShipName);
          setCompanyName(selectedCompanyName);
        }}
      />
    </>
  );
}