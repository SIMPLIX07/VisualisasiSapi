'use client';

import { useEffect, useState } from 'react';

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function formatDateInput(date) {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDateDisplay(date) {
  if (!date) return '-';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days = [];

  // Hari kosong sebelum tanggal 1
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }

  // Semua tanggal pada bulan
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function isSameDate(date1, date2) {
  if (!date1 || !date2) return false;

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isBetween(date, startDate, endDate) {
  if (!date || !startDate || !endDate) return false;

  const time = date.getTime();
  const start = startDate.getTime();
  const end = endDate.getTime();

  return time > start && time < end;
}

function Calendar({
  date,
  selectedDate,
  startDate,
  endDate,
  onSelect,
  onPrevious,
  onNext,
}) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = getCalendarDays(year, month);

  return (
    <div className="w-full">
      {/* Header kalender */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onPrevious}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
          aria-label="Bulan sebelumnya"
        >
          ‹
        </button>

        <div className="text-center">
          <div className="text-sm font-bold text-[#0d1b3e]">
            {MONTHS[month]}
          </div>
          <div className="text-xs text-gray-500">{year}</div>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
          aria-label="Bulan berikutnya"
        >
          ›
        </button>
      </div>

      {/* Nama hari */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-semibold text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Tanggal */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-9" />;
          }

          const isStart = isSameDate(day, startDate);
          const isEnd = isSameDate(day, endDate);
          const isSelected = isSameDate(day, selectedDate);
          const between = isBetween(day, startDate, endDate);

          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              className={`
                h-9 w-9 mx-auto rounded-full text-xs transition
                ${
                  isStart || isEnd
                    ? 'bg-[#0d1b3e] text-white font-bold'
                    : between
                      ? 'bg-blue-100 text-[#0d1b3e] font-semibold'
                      : isSelected
                        ? 'border-2 border-[#0d1b3e] text-[#0d1b3e] font-bold'
                        : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DatePickerModal({
  isOpen,
  onClose,
  onApply,
  initialStartDate = null,
  initialEndDate = null,
}) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const today = new Date();

  const [leftMonth, setLeftMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [rightMonth, setRightMonth] = useState(
    new Date(today.getFullYear(), today.getMonth() + 1, 1)
  );

  useEffect(() => {
    if (isOpen) {
      setStartDate(initialStartDate);
      setEndDate(initialEndDate);

      const baseDate = initialStartDate || new Date();

      setLeftMonth(
        new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
      );

      setRightMonth(
        new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1)
      );
    }
  }, [isOpen, initialStartDate, initialEndDate]);

  if (!isOpen) return null;

  const handleStartSelect = (date) => {
    setStartDate(date);

    // Jika tanggal selesai sudah ada tetapi lebih kecil
    // dari tanggal mulai, hapus tanggal selesai.
    if (endDate && date > endDate) {
      setEndDate(null);
    }
  };

  const handleEndSelect = (date) => {
    if (!startDate) {
      // Kalau user belum memilih tanggal mulai,
      // tanggal pertama otomatis menjadi tanggal mulai.
      setStartDate(date);
      return;
    }

    if (date < startDate) {
      // Jika tanggal selesai lebih kecil,
      // jadikan tanggal tersebut sebagai tanggal mulai.
      setEndDate(startDate);
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };

  const handleApply = () => {
    if (!startDate || !endDate) {
      return;
    }

    if (onApply) {
      onApply(startDate, endDate);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0d1b3e]">
                Pilih Rentang Tanggal
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Tentukan tanggal mulai dan tanggal selesai.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition text-xl"
              aria-label="Tutup"
            >
              ×
            </button>
          </div>
        </div>

        {/* Ringkasan tanggal */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tanggal mulai */}
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                Tanggal Mulai
              </div>

              <div className="text-sm font-semibold text-[#0d1b3e]">
                {formatDateDisplay(startDate)}
              </div>
            </div>

            {/* Tanggal selesai */}
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                Tanggal Selesai
              </div>

              <div className="text-sm font-semibold text-[#0d1b3e]">
                {formatDateDisplay(endDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Dua kalender */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Kalender kiri */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-bold uppercase text-gray-500 mb-4">
                Tanggal Mulai
              </div>

              <Calendar
                date={leftMonth}
                selectedDate={startDate}
                startDate={startDate}
                endDate={endDate}
                onSelect={handleStartSelect}
                onPrevious={() =>
                  setLeftMonth(
                    new Date(
                      leftMonth.getFullYear(),
                      leftMonth.getMonth() - 1,
                      1
                    )
                  )
                }
                onNext={() =>
                  setLeftMonth(
                    new Date(
                      leftMonth.getFullYear(),
                      leftMonth.getMonth() + 1,
                      1
                    )
                  )
                }
              />
            </div>

            {/* Kalender kanan */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="text-xs font-bold uppercase text-gray-500 mb-4">
                Tanggal Selesai
              </div>

              <Calendar
                date={rightMonth}
                selectedDate={endDate}
                startDate={startDate}
                endDate={endDate}
                onSelect={handleEndSelect}
                onPrevious={() =>
                  setRightMonth(
                    new Date(
                      rightMonth.getFullYear(),
                      rightMonth.getMonth() - 1,
                      1
                    )
                  )
                }
                onNext={() =>
                  setRightMonth(
                    new Date(
                      rightMonth.getFullYear(),
                      rightMonth.getMonth() + 1,
                      1
                    )
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!startDate || !endDate}
            className={`
              px-5 py-2 rounded-lg text-sm font-semibold transition
              ${
                startDate && endDate
                  ? 'bg-[#0d1b3e] text-white hover:bg-[#172a58]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
}