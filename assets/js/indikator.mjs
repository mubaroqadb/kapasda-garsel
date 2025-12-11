export const BATAS_LAYAK = 400;

// Indicator configurations with formulas
const INDICATORS = [
  {
    no: 1,
    nama: "Lokasi Ibukota",
    subs: [
      {
        id: "1.1",
        nama: "Rasio ketimpangan jarak (batas terdekat/terjauh dengan ibukota)",
        pembanding: 55,
        bobot: 2,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r <= 0.2
            ? 1
            : r <= 0.4
            ? 2
            : r <= 0.6
            ? 3
            : r <= 0.8
            ? 4
            : 5,
      },
      {
        id: "1.2",
        nama: "Ketersediaan lahan pusat pemerintahan (ha)",
        pembanding: 50,
        bobot: 2,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v <= 30
            ? 1
            : v <= 40
            ? 2
            : v <= 50
            ? 3
            : v <= 60
            ? 4
            : 5,
      },
    ],
  },
  {
    no: 2,
    nama: "Hidrografi",
    subs: [
      {
        id: "2.1",
        nama: "Potensi air permukaan dan air tanah (liter/detik)",
        pembanding: 4000,
        bobot: 1,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v <= 1000
            ? 1
            : v <= 2000
            ? 2
            : v <= 3000
            ? 3
            : v <= 4000
            ? 4
            : 5,
      },
      {
        id: "2.2",
        nama: "Ketersediaan air baku untuk penduduk & ekonomi (%)",
        pembanding: 40,
        bobot: 1,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v <= 10
            ? 1
            : v <= 20
            ? 2
            : v <= 30
            ? 3
            : v <= 40
            ? 4
            : 5,
      },
    ],
  },
  {
    no: 3,
    nama: "Kerawanan Bencana",
    subs: [
      {
        id: "3.1",
        nama: "Indeks Risiko Bencana Indonesia (IRBI) - Kab. Induk",
        pembanding: 72,
        bobot: 1,
        type: "direct",
        skorFunc: (v) => (v === "" ? 0 : v < 72 ? 5 : v <= 144 ? 3 : 1),
      },
      {
        id: "3.2",
        nama: "Jumlah kejadian bencana alam 10 tahun terakhir (kali)",
        pembanding: 200,
        bobot: 2,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v === 0
            ? 5
            : v <= 5
            ? 4
            : v <= 10
            ? 3
            : v <= 15
            ? 2
            : 1,
      },
    ],
  },
  {
    no: 4,
    nama: "Kualitas SDM",
    subs: [
      {
        id: "4.1",
        nama: "Rasio Angka Lama Sekolah (RLS) CDP vs Pulau Jawa",
        pembanding: 8.61,
        bobot: 4,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 1
            ? 5
            : r >= 0.9
            ? 4
            : r >= 0.8
            ? 3
            : r >= 0.7
            ? 2
            : 1,
      },
      {
        id: "4.2",
        nama: "Rasio APK Pendidikan Menengah Atas vs Pulau Jawa",
        pembanding: 82.43,
        bobot: 4,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 1
            ? 5
            : r >= 0.9
            ? 4
            : r >= 0.8
            ? 3
            : r >= 0.7
            ? 2
            : 1,
      },
      {
        id: "4.3",
        nama: "Rasio APK Pendidikan Dasar vs Pulau Jawa",
        pembanding: 109.52,
        bobot: 4,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 1
            ? 5
            : r >= 0.9
            ? 4
            : r >= 0.8
            ? 3
            : r >= 0.7
            ? 2
            : 1,
      },
    ],
  },
  {
    no: 5,
    nama: "Distribusi Penduduk",
    subs: [
      {
        id: "5.1",
        nama: "Rasio kepadatan penduduk CDP vs rata-rata Pulau Jawa",
        pembanding: 1117,
        bobot: 3,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 1
            ? 5
            : r >= 0.9
            ? 4
            : r >= 0.8
            ? 3
            : r >= 0.7
            ? 2
            : 1,
      },
    ],
  },
  {
    no: 6,
    nama: "Tindakan Kriminal Umum",
    subs: [
      {
        id: "6.1",
        nama: "Rasio kriminal per 10.000 penduduk CDP vs Pulau Jawa",
        pembanding: 5.2,
        bobot: 2,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 1
            ? 1
            : r >= 0.9
            ? 2
            : r >= 0.8
            ? 3
            : r >= 0.7
            ? 4
            : 5,
      },
    ],
  },
  {
    no: 7,
    nama: "Konflik Sosial",
    subs: [
      {
        id: "7.1",
        nama: "Jumlah konflik sosial di CDP (kali)",
        pembanding: 2,
        bobot: 2,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v === 0
            ? 5
            : v <= 5
            ? 4
            : v <= 10
            ? 3
            : v <= 15
            ? 2
            : 1,
      },
    ],
  },
  {
    no: 8,
    nama: "Partisipasi Masyarakat dalam Pemilu",
    subs: [
      {
        id: "8.1",
        nama: "Persentase partisipasi pemilih (%)",
        pembanding: 70,
        bobot: 3,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v > 70
            ? 5
            : v >= 60
            ? 4
            : v >= 50
            ? 3
            : v >= 40
            ? 2
            : 1,
      },
    ],
  },
  {
    no: 9,
    nama: "Kohesivitas Sosial",
    subs: [
      {
        id: "9.1",
        nama: "Jumlah etnik/subetnik di CDP",
        pembanding: 1,
        bobot: 2,
        type: "direct",
        skorFunc: (v) =>
          v === "" ? 0 : v <= 1 ? 5 : v <= 3 ? 4 : v <= 5 ? 3 : v <= 7 ? 2 : 1,
      },
    ],
  },
  {
    no: 10,
    nama: "Organisasi Kemasyarakatan",
    subs: [
      {
        id: "10.1",
        nama: "Jumlah ormas terdaftar di CDP",
        pembanding: 40,
        bobot: 3,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v > 40
            ? 5
            : v >= 31
            ? 4
            : v >= 21
            ? 3
            : v >= 11
            ? 2
            : 1,
      },
    ],
  },
  {
    no: 11,
    nama: "Pertumbuhan Ekonomi",
    subs: [
      {
        id: "11.1",
        nama: "Rasio pertumbuhan ekonomi 5 tahun CDP vs Pulau Jawa",
        pembanding: 5.43,
        bobot: 3,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 1
            ? 5
            : r >= 0.9
            ? 4
            : r >= 0.8
            ? 3
            : r >= 0.7
            ? 2
            : 1,
      },
      {
        id: "11.2",
        nama: "Rasio pendapatan perkapita CDP vs Pulau Jawa (Rp)",
        pembanding: 45000000,
        bobot: 3,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 1
            ? 5
            : r >= 0.9
            ? 4
            : r >= 0.8
            ? 3
            : r >= 0.7
            ? 2
            : 1,
      },
      {
        id: "11.3",
        nama: "Rasio IPM CDP vs Pulau Jawa",
        pembanding: 74.24,
        bobot: 3,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 1
            ? 5
            : r >= 0.9
            ? 4
            : r >= 0.8
            ? 3
            : r >= 0.7
            ? 2
            : 1,
      },
      {
        id: "11.4",
        nama: "Rasio angka kemiskinan CDP vs Pulau Jawa (%)",
        pembanding: 7.83,
        bobot: 3,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r < 0.7
            ? 5
            : r < 0.8
            ? 4
            : r < 0.9
            ? 3
            : r < 1
            ? 2
            : 1,
      },
    ],
  },
  {
    no: 12,
    nama: "Potensi Unggulan Daerah",
    subs: [
      {
        id: "12.1",
        nama: "Rasio PDRB sektor pertanian perkapita vs PDB nasional",
        pembanding: 1,
        bobot: 1,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v >= 1
            ? 5
            : v >= 0.9
            ? 4
            : v >= 0.8
            ? 3
            : v >= 0.7
            ? 2
            : 1,
      },
      {
        id: "12.2",
        nama: "Rasio PDRB sektor industri perkapita vs rata-rata Pulau Jawa",
        pembanding: 1,
        bobot: 1,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v >= 1
            ? 5
            : v >= 0.9
            ? 4
            : v >= 0.8
            ? 3
            : v >= 0.7
            ? 2
            : 1,
      },
      {
        id: "12.3",
        nama: "Rasio PDRB sektor perdagangan, hotel, restoran perkapita",
        pembanding: 1,
        bobot: 2,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v >= 1
            ? 5
            : v >= 0.9
            ? 4
            : v >= 0.8
            ? 3
            : v >= 0.7
            ? 2
            : 1,
      },
      {
        id: "12.4",
        nama: "Rasio PDRB sektor pengangkutan & komunikasi perkapita",
        pembanding: 1,
        bobot: 1,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v >= 1
            ? 5
            : v >= 0.9
            ? 4
            : v >= 0.8
            ? 3
            : v >= 0.7
            ? 2
            : 1,
      },
      {
        id: "12.5",
        nama: "Rasio PDRB sektor keuangan & persewaan perkapita",
        pembanding: 1,
        bobot: 2,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v >= 1
            ? 5
            : v >= 0.9
            ? 4
            : v >= 0.8
            ? 3
            : v >= 0.7
            ? 2
            : 1,
      },
      {
        id: "12.6",
        nama: "Rasio PDRB sektor jasa perkapita",
        pembanding: 1,
        bobot: 2,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v >= 1
            ? 5
            : v >= 0.9
            ? 4
            : v >= 0.8
            ? 3
            : v >= 0.7
            ? 2
            : 1,
      },
    ],
  },
  {
    no: 13,
    nama: "Kapasitas PAD Induk",
    subs: [
      {
        id: "13.1",
        nama: "Rasio PAD induk terhadap total pendapatan daerah induk",
        pembanding: 4780000000000,
        bobot: 5,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 1
            ? 5
            : r >= 0.9
            ? 4
            : r >= 0.8
            ? 3
            : r >= 0.7
            ? 2
            : 1,
      },
    ],
  },
  {
    no: 14,
    nama: "Potensi PAD CDP",
    subs: [
      {
        id: "14.1",
        nama: "Rasio PAD CDP terhadap total PAD induk",
        pembanding: 538000000000,
        bobot: 8,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 1
            ? 1
            : r >= 0.9
            ? 2
            : r >= 0.8
            ? 3
            : r >= 0.7
            ? 4
            : 5,
      },
    ],
  },
  {
    no: 15,
    nama: "Pengelolaan Keuangan & Aset",
    subs: [
      {
        id: "15.1",
        nama: "Jumlah opini WTP BPK dalam 5 tahun terakhir (1-5)",
        pembanding: 5,
        bobot: 4,
        type: "direct",
        skorFunc: (v) =>
          v === "" ? 0 : v >= 5 ? 5 : v >= 4 ? 4 : v >= 3 ? 3 : v >= 2 ? 2 : 1,
      },
    ],
  },
  {
    no: 16,
    nama: "Aksesibilitas Pelayanan Dasar Pendidikan",
    subs: [
      {
        id: "16.1",
        nama: "Rata-rata jumlah murid per ruang belajar SD",
        pembanding: 28,
        bobot: 2,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v <= 32
            ? 1
            : v <= 35
            ? 2
            : v <= 39
            ? 3
            : v <= 42
            ? 4
            : 5,
      },
      {
        id: "16.2",
        nama: "Rata-rata jumlah murid per ruang belajar SMP",
        pembanding: 32,
        bobot: 2,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v <= 32
            ? 1
            : v <= 35
            ? 2
            : v <= 39
            ? 3
            : v <= 42
            ? 4
            : 5,
      },
      {
        id: "16.3",
        nama: "Rata-rata jumlah murid per ruang belajar SMA/SMK",
        pembanding: 36,
        bobot: 1,
        type: "direct",
        skorFunc: (v) =>
          v === ""
            ? 0
            : v <= 32
            ? 1
            : v <= 35
            ? 2
            : v <= 39
            ? 3
            : v <= 42
            ? 4
            : 5,
      },
    ],
  },
  {
    no: 17,
    nama: "Aksesibilitas Pelayanan Dasar Kesehatan",
    subs: [
      {
        id: "17.1",
        nama: "Rasio penduduk per dokter (jumlah penduduk/dokter)",
        pembanding: 2500,
        bobot: 3,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r < 2500
            ? 1
            : r < 3000
            ? 2
            : r < 3500
            ? 3
            : r < 4000
            ? 4
            : 5,
      },
      {
        id: "17.2",
        nama: "Rasio penduduk per tempat tidur RS/Puskesmas (penduduk/TT)",
        pembanding: 1000,
        bobot: 2,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r <= 1000
            ? 1
            : r <= 1500
            ? 2
            : r <= 2000
            ? 3
            : r <= 2500
            ? 4
            : 5,
      },
    ],
  },
  {
    no: 18,
    nama: "Aksesibilitas Pelayanan Dasar Infrastruktur",
    subs: [
      {
        id: "18.1",
        nama: "Rasio (panjang jalan/luas) CDP vs rata-rata Pulau Jawa",
        pembanding: 2850,
        bobot: 10,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 0.8
            ? 1
            : r >= 0.6
            ? 2
            : r >= 0.41
            ? 3
            : r >= 0.21
            ? 4
            : 5,
      },
    ],
  },
  {
    no: 19,
    nama: "Jumlah Pegawai ASN di Daerah Induk",
    subs: [
      {
        id: "19.1",
        nama: "Rasio ASN/penduduk induk vs rata-rata Pulau Jawa",
        pembanding: 2680000,
        bobot: 2,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 0.8
            ? 1
            : r >= 0.6
            ? 2
            : r >= 0.41
            ? 3
            : r >= 0.21
            ? 4
            : 5,
      },
      {
        id: "19.2",
        nama: "Rasio ASN CDP terhadap ASN induk",
        pembanding: 12500,
        bobot: 2,
        type: "ratio",
        skorFunc: (r) =>
          r === ""
            ? 0
            : r >= 0.8
            ? 1
            : r >= 0.6
            ? 2
            : r >= 0.41
            ? 3
            : r >= 0.21
            ? 4
            : 5,
      },
    ],
  },
  {
    no: 20,
    nama: "Rancangan RTRW Daerah Persiapan",
    subs: [
      {
        id: "20.1",
        nama: "Ketersediaan dokumen RTRW CDP (Skor 1, 3, atau 5)",
        pembanding: 3,
        bobot: 2,
        type: "direct",
        skorFunc: (v) => (v === "" ? 0 : v >= 5 ? 5 : v >= 3 ? 3 : 1),
      },
    ],
  },
];

export const INDIKATORS = INDICATORS.map(group => ({
  ...group,
  subs: group.subs.map(sub => ({
    ...sub,
    skor: sub.skorFunc
  }))
}));
