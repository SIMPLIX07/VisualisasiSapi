import Image from 'next/image';
import Link from 'next/link';
import ActivityGallery from '../components/ActivityGallery';

const photoFiles = [
  'Dewi Wonder, S.K.H (B0901251057).png',
  'Fadhlullah Zakly Permana, S.K.H (B0901251084).jpg',
  'Fathia Azka Qolbi S.K.H. (B0901251061).png',
  'Muh.Riswan Hidayat Idrus, S.K.H (B0901211046).JPG',
  'Nur Fajriansyah, S.K.H (B0901251034).png',
  'Pintan Nur Fallah, S.K.H (B0901211075).jpg',
];

function getStudentDetails(fileName) {
  const nameWithoutExtension = fileName.replace(/\.[^.]+$/, '');
  const match = nameWithoutExtension.match(/^(.*?)\s*\(([^)]+)\)$/);

  return {
    name: match?.[1] || nameWithoutExtension,
    nim: match?.[2] || 'NIM tidak tersedia',
  };
}

function SiteNavigation() {
  return (
    <nav className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-black/25 px-5 py-3 text-white md:px-8">
      <Link href="/" className="flex items-center gap-2 text-sm font-medium tracking-wide">
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white">
          <Image src="/assets/img/Logo_Badan_Karantina_Indonesia.png" alt="Logo BKHIT Lampung" width={32} height={32} className="object-contain" />
        </span>
        <span>BKHIT Lampung</span>
      </Link>
      <div className="flex items-center gap-5 text-xs md:gap-7 md:text-sm">
        <Link href="/" className="transition hover:text-gray-300">Home</Link>
        <Link href="/about" className="font-bold transition hover:text-gray-300">About us</Link>
        <button type="button" aria-label="Search" className="transition hover:text-gray-300">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
        </button>
      </div>
    </nav>
  );
}

function SiteFooter() {
  return (
    <footer className="pb-10 pt-4 text-center">
      <p className="mb-5 text-sm text-gray-700">Karantina KUAT untuk Indonesia Hebat!!</p>
      <div className="flex justify-center gap-4">
        <a href="https://karantinaindonesia.go.id/" target="_blank" rel="noopener noreferrer" aria-label="Website Badan Karantina Indonesia"><Image src="/assets/img/Logo_Badan_Karantina_Indonesia.png" alt="Badan Karantina Indonesia" width={32} height={32} className="object-contain" /></a>
        <a href="https://www.instagram.com/karantinalampung?igsi=MWh3bHVkYnp5emprNQ==" target="_blank" rel="noopener noreferrer" aria-label="Instagram Karantina Lampung"><Image src="/assets/img/instagram.png" alt="Instagram" width={32} height={32} className="object-contain" /></a>
        <a href="https://maps.app.goo.gl/MyWpqhiLCY7UDR547?g_st=iw" target="_blank" rel="noopener noreferrer" aria-label="Lokasi Karantina Lampung"><Image src="/assets/img/Google_Maps_Logo_2020.svg.webp" alt="Google Maps" width={32} height={32} className="object-contain" /></a>
      </div>
    </footer>
  );
}

export const metadata = {
  title: 'About Us - BKHIT Lampung',
  description: 'Kenali mahasiswa koasistensi BKHIT Lampung.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <header className="relative flex h-64 items-center justify-center bg-cover bg-center text-white md:h-80" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.58), rgba(0,0,0,0.58)), url("/assets/img/Background.jpg")' }}>
        <SiteNavigation />
        <h1 className="mt-8 text-4xl font-bold italic tracking-tight md:text-5xl">ABOUT US</h1>
      </header> 
      <main className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">
        <section className="mx-auto max-w-3xl text-sm leading-7 text-gray-800">
          <p className="mb-4 text-[#182b69]">Halo!</p>
          <p>Enam mahasiswa yang sedang menjalani Stase Koasistensi Karantina Balai Karantina Hewan, Ikan, dan Tumbuhan Lampung mencoba merancang <em>website</em> untuk memfasilitasi akses informasi mengenai kapal angkut ternak dan petugas karantina di lapangan. Semoga <em>website</em> ini dapat bermanfaat dan membawa perubahan berarti.</p>
          <p className="mt-4 text-[#182b69]">Salam kenal!</p>
        </section>
        <section className="mt-12 border-t border-gray-300 pt-8">
          <h2 className="mb-9 text-center text-xl italic text-[#182b69]">Get to know us!</h2>
          <div className="grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {photoFiles.map((fileName) => {
              const student = getStudentDetails(fileName);

              return (
                <article key={fileName} className="text-center">
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                    <Image src={`/FotoMahasiswa/${fileName}`} alt={`Foto ${student.name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover object-top" />
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-[#182b69]">{student.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">{student.nim}</p>
                </article> 
              );
            })}
          </div>
        </section>
        <ActivityGallery />
        <div className="mt-12"><Link href="/" className="block w-full rounded bg-[#0d1b3e] py-2.5 text-center text-sm font-medium text-white transition hover:bg-[#172b5b] sm:max-w-32">Back</Link></div>
        <SiteFooter />
      </main>
    </div>
  );
}