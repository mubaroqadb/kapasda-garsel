const fs = require('fs');

const benchmarks = {
    '7': 7.25, '8': 68.5, '9': 98.5, '10': 421.5,
    '17': 4.65, '18': 31, '19': 69.67, '20': 7.95,
    '30': 28, '31': 32, '32': 36
};

// Same as index.html
const INDICATORS = [
    { no: 1, name: 'Jarak ke Ibukota CDP', bobot: 2, type: 'direct', skorFunc: (v) => v <= 60 ? 5 : v <= 80 ? 4 : v <= 100 ? 3 : v <= 120 ? 2 : 1 },
    { no: 2, name: 'Luas Lahan Pemerintahan', bobot: 2, type: 'direct', skorFunc: (v) => v >= 60 ? 5 : v >= 50 ? 4 : v >= 40 ? 3 : 2 },
    { no: 3, name: 'Potensi Air Permukaan', bobot: 1, type: 'direct', skorFunc: (v) => v >= 16000 ? 5 : v >= 12000 ? 4 : v >= 8000 ? 3 : 2 },
    { no: 4, name: 'Ketersediaan Air Baku', bobot: 1, type: 'direct', skorFunc: (v) => v >= 80 ? 5 : v >= 60 ? 4 : v >= 40 ? 3 : 2 },
    { no: 5, name: 'IRBI Kab. Garut (Fixed)', bobot: 1, type: 'direct', skorFunc: (v) => 5 },
    { no: 6, name: 'Kejadian Bencana 10 Tahun', bobot: 2, type: 'direct', skorFunc: (v) => v === 0 ? 5 : v <= 5 ? 4 : v <= 10 ? 3 : 2 },
    { no: 7, name: 'Rata-rata Lama Sekolah (RLS)', bobot: 4, type: 'ratio', ref: '7', skorFunc: (r) => r >= 1 ? 5 : r >= 0.9 ? 4 : r >= 0.8 ? 3 : r >= 0.7 ? 2 : 1 },
    { no: 8, name: 'APK SMA/SMK', bobot: 4, type: 'ratio', ref: '8', skorFunc: (r) => r >= 1 ? 5 : r >= 0.9 ? 4 : r >= 0.8 ? 3 : r >= 0.7 ? 2 : 1 },
    { no: 9, name: 'APK SD-SMP (Dikdas)', bobot: 4, type: 'ratio', ref: '9', skorFunc: (r) => r >= 1 ? 5 : r >= 0.9 ? 4 : r >= 0.8 ? 3 : r >= 0.7 ? 2 : 1 },
    { no: 10, name: 'Rasio Kepadatan Penduduk', bobot: 3, type: 'ratio', ref: '10', skorFunc: (r) => r < 0.5 ? 5 : r <= 0.8 ? 4 : r <= 1 ? 3 : r <= 1.2 ? 2 : 1 },
    { no: 11, name: 'Jumlah Kriminal/Tahun', bobot: 2, type: 'direct', skorFunc: (v) => v === 0 ? 5 : v <= 5 ? 4 : v <= 10 ? 3 : 2 },
    { no: 12, name: 'Jumlah Konflik 5 Tahun', bobot: 2, type: 'direct', skorFunc: (v) => v === 0 ? 5 : v <= 2 ? 5 : v <= 5 ? 4 : v <= 10 ? 3 : 1 },
    { no: 13, name: 'Jumlah DPT Pemilu 2024', bobot: 3, type: 'direct', skorFunc: (v) => v >= 50000 ? 5 : v >= 40000 ? 4 : v >= 30000 ? 3 : 2 },
    { no: 14, name: 'Partisipasi Pemilih', bobot: 3, type: 'direct', skorFunc: (v) => v >= 80 ? 5 : v >= 75 ? 4 : v >= 70 ? 3 : 2 },
    { no: 15, name: 'Persentase Etnik Sunda', bobot: 2, type: 'direct', skorFunc: (v) => v >= 90 ? 4 : 5 },
    { no: 16, name: 'Jumlah Ormas Terdaftar', bobot: 3, type: 'direct', skorFunc: (v) => v >= 20 ? 5 : v >= 15 ? 4 : v >= 10 ? 3 : 2 },
    { no: 17, name: 'Rata-rata LPE 5 Tahun', bobot: 3, type: 'ratio', ref: '17', skorFunc: (r) => r >= 1 ? 5 : r >= 0.9 ? 4 : r >= 0.8 ? 3 : r >= 0.7 ? 2 : 1 },
    { no: 18, name: 'Pendapatan Per Kapita', bobot: 3, type: 'ratio', ref: '18', skorFunc: (r) => r >= 1 ? 5 : r >= 0.9 ? 4 : r >= 0.8 ? 3 : r >= 0.7 ? 2 : 1 },
    { no: 19, name: 'IPM Kecamatan', bobot: 3, type: 'ratio', ref: '19', skorFunc: (r) => r >= 1 ? 5 : r >= 0.9 ? 4 : r >= 0.8 ? 3 : r >= 0.7 ? 2 : 1 },
    { no: 20, name: 'Penduduk Miskin', bobot: 3, type: 'ratio', ref: '20', skorFunc: (r) => r < 0.7 ? 5 : r <= 1 ? 4 : r <= 1.2 ? 3 : r <= 1.4 ? 2 : 1 },
    { no: 21, name: 'PDRB Sektor Pertanian', bobot: 1, type: 'direct', skorFunc: (v) => v > 0 ? 4 : 1 },
    { no: 22, name: 'PDRB Sektor Industri', bobot: 1, type: 'direct', skorFunc: (v) => v > 0 ? 4 : 1 },
    { no: 23, name: 'PDRB Sektor Perdagangan', bobot: 2, type: 'direct', skorFunc: (v) => v > 0 ? 4 : 1 },
    { no: 24, name: 'PDRB Sektor Transportasi', bobot: 1, type: 'direct', skorFunc: (v) => v > 0 ? 4 : 1 },
    { no: 25, name: 'PDRB Sektor Keuangan', bobot: 2, type: 'direct', skorFunc: (v) => v > 0 ? 4 : 1 },
    { no: 26, name: 'PDRB Sektor Jasa', bobot: 2, type: 'direct', skorFunc: (v) => v > 0 ? 4 : 1 },
    { no: 27, name: 'PAD Kab. Garut 2024 (Fixed)', bobot: 5, type: 'direct', skorFunc: (v) => 5 },
    { no: 28, name: 'Total PAD Kecamatan', bobot: 8, type: 'direct', skorFunc: (v) => v >= 20 ? 5 : v >= 10 ? 4 : 3 },
    { no: 29, name: 'Opini WTP 5 Tahun (Fixed)', bobot: 4, type: 'direct', skorFunc: (v) => 5 },
    { no: 30, name: 'Rasio Murid SD/Kelas', bobot: 2, type: 'ratio', ref: '30', skorFunc: (r) => (r >= 0.8 && r <= 1.1) ? 5 : (r >= 0.7 && r < 0.8 || r > 1.1 && r <= 1.2) ? 4 : (r >= 0.6 && r < 0.7 || r > 1.2 && r <= 1.3) ? 3 : (r >= 0.5 && r < 0.6 || r > 1.3 && r <= 1.4) ? 2 : 1 },
    { no: 31, name: 'Rasio Murid SMP/Kelas', bobot: 2, type: 'ratio', ref: '31', skorFunc: (r) => (r >= 0.8 && r <= 1.1) ? 5 : (r >= 0.7 && r < 0.8 || r > 1.1 && r <= 1.2) ? 4 : (r >= 0.6 && r < 0.7 || r > 1.2 && r <= 1.3) ? 3 : (r >= 0.5 && r < 0.6 || r > 1.3 && r <= 1.4) ? 2 : 1 },
    { no: 32, name: 'Rasio Murid SMA/Kelas', bobot: 1, type: 'ratio', ref: '32', skorFunc: (r) => (r >= 0.8 && r <= 1.1) ? 5 : (r >= 0.7 && r < 0.8 || r > 1.1 && r <= 1.2) ? 4 : (r >= 0.6 && r < 0.7 || r > 1.2 && r <= 1.3) ? 3 : (r >= 0.5 && r < 0.6 || r > 1.3 && r <= 1.4) ? 2 : 1 },
    { no: 33, name: 'Jumlah Dokter', bobot: 3, type: 'direct', skorFunc: (v) => v >= 5 ? 5 : v >= 2 ? 4 : 3 },
    { no: 34, name: 'Jumlah Tempat Tidur RS', bobot: 2, type: 'direct', skorFunc: (v) => v >= 100 ? 5 : v >= 50 ? 4 : 3 },
    { no: 35, name: 'Panjang Jalan Desa', bobot: 10, type: 'direct', skorFunc: (v) => v >= 150 ? 5 : v >= 80 ? 4 : 3 },
    { no: 36, name: 'ASN Kab. Garut (Fixed)', bobot: 2, type: 'direct', skorFunc: (v) => 5 },
    { no: 37, name: 'ASN/P3K di Kecamatan', bobot: 2, type: 'direct', skorFunc: (v) => v >= 1000 ? 5 : v >= 500 ? 4 : 3 },
    { no: 38, name: 'Status RTRW CDP (Fixed)', bobot: 2, type: 'direct', skorFunc: (v) => 5 }
];

function calculateForKecamatan(kecamatan_nama, inputs) {
    let total = 0;
    const details = {};
    INDICATORS.forEach(ind => {
        let val = inputs[ind.name] || 0;
        let skor = 0;
        if (ind.type === 'ratio') {
            skor = ind.skorFunc(val / benchmarks[ind.ref]);
        } else {
            skor = ind.skorFunc(val);
        }
        total += skor * ind.bobot;
        details[ind.no] = { input: val, skor: skor, nilai: skor * ind.bobot };
    });
    return { total: Math.round(total), details };
}

async function main() {
    const rawData = JSON.parse(fs.readFileSync('raw_data.json', 'utf8'));
    let sql = "";
    const summary = [];
    
    rawData.forEach(item => {
        const { total, details } = calculateForKecamatan(item.kecamatan_nama, item.data);
        summary.push({ kecamatan: item.kecamatan_nama, total });
        
        const dataJson = JSON.stringify(details);
        sql += `UPDATE penilaian SET total_nilai = ${total}, status = '${total >= 400 ? 'LAYAK' : 'TIDAK LAYAK'}', detail_perhitungan = '${dataJson.replace(/'/g, "''")}' WHERE kecamatan_nama = '${item.kecamatan_nama}';\n`;
    });
    
    fs.writeFileSync('recalculate.sql', sql);
    console.table(summary);
}

main().catch(console.error);
