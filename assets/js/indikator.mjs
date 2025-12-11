// Modern indicator module for KAPASDA with enhanced scoring and validation

import { dataPembanding } from './data.mjs';
import { showToast, formatNumber, validateNumber } from './utils.mjs';

// Enhanced indicator definitions with validation rules
export const INDIKATORS = [
  {
    no: 1,
    nama: "Kondisi Geografis",
    subs: [
      {
        id: "1.1",
        nama: "Luas Wilayah",
        bobot: 10,
        type: "semakin_baik",
        pembanding: 100,
        satuan: "km²",
        min: 0,
        max: 10000,
        required: true,
        description: "Total luas wilayah kecamatan dalam kilometer persegi",
        validation: {
          pattern: /^\d+(\.\d{1,2})?$/,
          message: "Masukkan angka yang valid (contoh: 123.45)"
        }
      },
      {
        id: "1.2",
        nama: "Batas Wilayah",
        bobot: 5,
        type: "semakin_baik",
        pembanding: 8,
        satuan: "desa/kota",
        min: 0,
        max: 20,
        required: true,
        description: "Jumlah batas wilayah dengan desa/kota lain",
        validation: {
          pattern: /^\d+$/,
          message: "Masukkan angka bulat yang valid"
        }
      }
    ]
  },
  {
    no: 2,
    nama: "Kondisi Demografi",
    subs: [
      {
        id: "2.1",
        nama: "Jumlah Penduduk",
        bobot: 15,
        type: "semakin_baik",
        pembanding: 50000,
        satuan: "jiwa",
        min: 1000,
        max: 200000,
        required: true,
        description: "Total jumlah penduduk kecamatan",
        validation: {
          pattern: /^\d+$/,
          message: "Masukkan angka bulat yang valid"
        }
      },
      {
        id: "2.2",
        nama: "Kepadatan Penduduk",
        bobot: 10,
        type: "optimal",
        pembanding: 500,
        satuan: "jiwa/km²",
        min: 50,
        max: 2000,
        required: true,
        optimalMin: 300,
        optimalMax: 700,
        description: "Kepadatan penduduk per kilometer persegi",
        validation: {
          pattern: /^\d+(\.\d{1,2})?$/,
          message: "Masukkan angka yang valid (contoh: 123.45)"
        }
      },
      {
        id: "2.3",
        nama: "Tingkat Pertumbuhan",
        bobot: 5,
        type: "optimal",
        pembanding: 2,
        satuan: "%",
        min: -5,
        max: 10,
        required: true,
        optimalMin: 1,
        optimalMax: 3,
        description: "Tingkat pertumbuhan penduduk per tahun",
        validation: {
          pattern: /^-?\d+(\.\d{1,2})?$/,
          message: "Masukkan angka yang valid (contoh: 2.5)"
        }
      }
    ]
  },
  {
    no: 3,
    nama: "Ketersediaan Sarana dan Prasarana",
    subs: [
      {
        id: "3.1",
        nama: "Jumlah Sekolah",
        bobot: 10,
        type: "semakin_baik",
        pembanding: 20,
        satuan: "unit",
        min: 0,
        max: 100,
        required: true,
        description: "Total jumlah sekolah (SD, SMP, SMA)",
        validation: {
          pattern: /^\d+$/,
          message: "Masukkan angka bulat yang valid"
        }
      },
      {
        id: "3.2",
        nama: "Jumlah Puskesmas",
        bobot: 8,
        type: "semakin_baik",
        pembanding: 5,
        satuan: "unit",
        min: 0,
        max: 20,
        required: true,
        description: "Total jumlah puskesmas dan pembantunya",
        validation: {
          pattern: /^\d+$/,
          message: "Masukkan angka bulat yang valid"
        }
      },
      {
        id: "3.3",
        nama: "Jumlah Pasar",
        bobot: 7,
        type: "semakin_baik",
        pembanding: 3,
        satuan: "unit",
        min: 0,
        max: 15,
        required: true,
        description: "Total jumlah pasar tradisional dan modern",
        validation: {
          pattern: /^\d+$/,
          message: "Masukkan angka bulat yang valid"
        }
      }
    ]
  },
  {
    no: 4,
    nama: "Kondisi Ekonomi",
    subs: [
      {
        id: "4.1",
        nama: "PDRB Per Kapita",
        bobot: 15,
        type: "semakin_baik",
        pembanding: 50000000,
        satuan: "rupiah",
        min: 10000000,
        max: 200000000,
        required: true,
        description: "Produk Domestik Regional Bruto per kapita",
        validation: {
          pattern: /^\d+$/,
          message: "Masukkan angka bulat yang valid"
        }
      },
      {
        id: "4.2",
        nama: "Tingkat Pengangguran",
        bobot: 10,
        type: "semakin_buruk",
        pembanding: 5,
        satuan: "%",
        min: 0,
        max: 30,
        required: true,
        description: "Tingkat pengangguran terbuka",
        validation: {
          pattern: /^\d+(\.\d{1,2})?$/,
          message: "Masukkan angka yang valid (contoh: 5.2)"
        }
      },
      {
        id: "4.3",
        nama: "Indeks Pembangunan",
        bobot: 5,
        type: "semakin_baik",
        pembanding: 75,
        satuan: "poin",
        min: 0,
        max: 100,
        required: true,
        description: "Indeks Pembangunan Manusia (IPM)",
        validation: {
          pattern: /^\d+(\.\d{1,2})?$/,
          message: "Masukkan angka yang valid (contoh: 75.5)"
        }
      }
    ]
  },
  {
    no: 5,
    nama: "Aksesibilitas dan Konektivitas",
    subs: [
      {
        id: "5.1",
        nama: "Panjang Jalan",
        bobot: 8,
        type: "semakin_baik",
        pembanding: 100,
        satuan: "km",
        min: 0,
        max: 500,
        required: true,
        description: "Total panjang jalan dalam kilometer",
        validation: {
          pattern: /^\d+(\.\d{1,2})?$/,
          message: "Masukkan angka yang valid (contoh: 123.45)"
        }
      },
      {
        id: "5.2",
        nama: "Ketersediaan Transportasi",
        bobot: 7,
        type: "semakin_baik",
        pembanding: 10,
        satuan: "jenis",
        min: 0,
        max: 20,
        required: true,
        description: "Jenis transportasi umum yang tersedia",
        validation: {
          pattern: /^\d+$/,
          message: "Masukkan angka bulat yang valid"
        }
      },
      {
        id: "5.3",
        nama: "Akses Internet",
        bobot: 5,
        type: "semakin_baik",
        pembanding: 80,
        satuan: "%",
        min: 0,
        max: 100,
        required: true,
        description: "Persentase wilayah dengan akses internet",
        validation: {
          pattern: /^\d+(\.\d{1,2})?$/,
          message: "Masukkan angka yang valid (contoh: 75.5)"
        }
      }
    ]
  }
];

// Scoring configuration
const SCORING_CONFIG = {
  maxScore: 100,
  minScore: 0,
  decimalPlaces: 2,
  roundingMethod: 'round',
  weightNormalization: true
};

// Validation state
const validationState = {
  errors: {},
  warnings: {},
  isValid: false,
  isDirty: false
};

/**
 * Modern scoring function with enhanced logic
 */
export function hitungSkor(nilai, pembanding, type, optimalMin = null, optimalMax = null) {
  if (!validateNumber(nilai) || !validateNumber(pembanding) || pembanding === 0) {
    return 0;
  }

  const numNilai = parseFloat(nilai);
  const numPembanding = parseFloat(pembanding);

  try {
    let skor;

    switch (type) {
      case 'semakin_baik':
        skor = (numNilai / numPembanding) * 100;
        break;

      case 'semakin_buruk':
        skor = (1 - (numNilai / numPembanding)) * 100;
        break;

      case 'optimal':
        if (optimalMin !== null && optimalMax !== null) {
          if (numNilai >= optimalMin && numNilai <= optimalMax) {
            skor = 100;
          } else {
            const distance = Math.min(
              Math.abs(numNilai - optimalMin),
              Math.abs(numNilai - optimalMax)
            );
            const maxDistance = Math.max(
              Math.abs(optimalMin),
              Math.abs(optimalMax)
            );
            skor = Math.max(0, 100 - (distance / maxDistance) * 100);
          }
        } else {
          // Fallback to semakin_baik if optimal range not specified
          skor = (numNilai / numPembanding) * 100;
        }
        break;

      default:
        console.warn(`Unknown scoring type: ${type}`);
        skor = (numNilai / numPembanding) * 100;
    }

    // Apply scoring configuration
    skor = Math.max(SCORING_CONFIG.minScore, Math.min(SCORING_CONFIG.maxScore, skor));
    skor = Math.round(skor * Math.pow(10, SCORING_CONFIG.decimalPlaces)) / Math.pow(10, SCORING_CONFIG.decimalPlaces);

    return skor;

  } catch (error) {
    console.error('Error calculating score:', error);
    return 0;
  }
}

/**
 * Enhanced validation for indicator values
 */
export function validateIndicatorValue(value, indicator) {
  const errors = [];
  const warnings = [];

  // Check if required
  if (indicator.required && (value === null || value === undefined || value === '')) {
    errors.push(`${indicator.nama} wajib diisi`);
    return { isValid: false, errors, warnings };
  }

  // Skip validation if empty and not required
  if (!value && value !== 0) {
    return { isValid: true, errors, warnings };
  }

  const numValue = parseFloat(value);

  // Check if valid number
  if (isNaN(numValue)) {
    errors.push(`${indicator.nama} harus berupa angka yang valid`);
    return { isValid: false, errors, warnings };
  }

  // Check pattern
  if (indicator.validation && indicator.validation.pattern) {
    if (!indicator.validation.pattern.test(value.toString())) {
      errors.push(indicator.validation.message || `${indicator.nama} format tidak valid`);
    }
  }

  // Check range
  if (indicator.min !== undefined && numValue < indicator.min) {
    errors.push(`${indicator.nama} minimal ${formatNumber(indicator.min)} ${indicator.satuan}`);
  }

  if (indicator.max !== undefined && numValue > indicator.max) {
    errors.push(`${indicator.nama} maksimal ${formatNumber(indicator.max)} ${indicator.satuan}`);
  }

  // Check optimal range warnings
  if (indicator.type === 'optimal' && indicator.optimalMin !== undefined && indicator.optimalMax !== undefined) {
    if (numValue < indicator.optimalMin) {
      warnings.push(`${indicator.nama} di bawah rentang optimal (${formatNumber(indicator.optimalMin)} - ${formatNumber(indicator.optimalMax)} ${indicator.satuan})`);
    } else if (numValue > indicator.optimalMax) {
      warnings.push(`${indicator.nama} di atas rentang optimal (${formatNumber(indicator.optimalMin)} - ${formatNumber(indicator.optimalMax)} ${indicator.satuan})`);
    }
  }

  // Check for unusual values
  if (indicator.pembanding && Math.abs(numValue / indicator.pembanding) > 10) {
    warnings.push(`${indicator.nama} jauh di atas/bawah nilai pembanding`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate entire form data
 */
export function validateFormData(formData) {
  const allErrors = {};
  const allWarnings = {};
  let isValid = true;

  INDIKATORS.forEach(group => {
    group.subs.forEach(sub => {
      const value = formData[sub.id];
      const validation = validateIndicatorValue(value, sub);

      if (!validation.isValid) {
        allErrors[sub.id] = validation.errors;
        isValid = false;
      }

      if (validation.warnings.length > 0) {
        allWarnings[sub.id] = validation.warnings;
      }
    });
  });

  validationState.errors = allErrors;
  validationState.warnings = allWarnings;
  validationState.isValid = isValid;

  return {
    isValid,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Calculate comprehensive score with breakdown
 */
export function calculateComprehensiveScore(formData, includeBreakdown = true) {
  const breakdown = {
    groups: [],
    totalScore: 0,
    totalWeight: 0,
    maxScore: 0,
    indicators: {}
  };

  let totalWeightedScore = 0;
  let totalWeight = 0;

  INDIKATORS.forEach(group => {
    const groupBreakdown = {
      no: group.no,
      nama: group.nama,
      subs: [],
      groupScore: 0,
      groupWeight: 0,
      groupMaxScore: 0
    };

    group.subs.forEach(sub => {
      const nilai = formData[sub.id] || 0;
      const pembanding = dataPembanding[sub.id] || sub.pembanding;
      const skor = hitungSkor(nilai, pembanding, sub.type, sub.optimalMin, sub.optimalMax);
      const skorTertimbang = skor * (sub.bobot / 100);

      const subBreakdown = {
        id: sub.id,
        nama: sub.nama,
        nilai,
        pembanding,
        skor,
        bobot: sub.bobot,
        skorTertimbang,
        type: sub.type,
        satuan: sub.satuan
      };

      groupBreakdown.subs.push(subBreakdown);
      breakdown.indicators[sub.id] = subBreakdown;

      groupBreakdown.groupScore += skorTertimbang;
      groupBreakdown.groupWeight += sub.bobot;
      groupBreakdown.groupMaxScore += sub.bobot;

      totalWeightedScore += skorTertimbang;
      totalWeight += sub.bobot;
    });

    groupBreakdown.groupScore = Math.round(groupBreakdown.groupScore * 100) / 100;
    breakdown.groups.push(groupBreakdown);
  });

  breakdown.totalScore = Math.round(totalWeightedScore * 100) / 100;
  breakdown.totalWeight = totalWeight;
  breakdown.maxScore = Math.round(totalWeight * 100) / 100;

  // Calculate percentage
  breakdown.percentage = breakdown.maxScore > 0 ? Math.round((breakdown.totalScore / breakdown.maxScore) * 100) : 0;

  // Add classification
  breakdown.classification = getClassification(breakdown.percentage);

  return includeBreakdown ? breakdown : {
    totalScore: breakdown.totalScore,
    percentage: breakdown.percentage,
    classification: breakdown.classification
  };
}

/**
 * Get classification based on score percentage
 */
function getClassification(percentage) {
  if (percentage >= 90) return { level: 'Sangat Baik', color: 'green', icon: 'star' };
  if (percentage >= 75) return { level: 'Baik', color: 'blue', icon: 'thumbs-up' };
  if (percentage >= 60) return { level: 'Cukup', color: 'yellow', icon: 'minus' };
  if (percentage >= 40) return { level: 'Kurang', color: 'orange', icon: 'exclamation' };
  return { level: 'Sangat Kurang', color: 'red', icon: 'times' };
}

/**
 * Get indicator by ID
 */
export function getIndicatorById(id) {
  for (const group of INDIKATORS) {
    const sub = group.subs.find(s => s.id === id);
    if (sub) {
      return { ...sub, groupNo: group.no, groupName: group.nama };
    }
  }
  return null;
}

/**
 * Get all indicators in flat format
 */
export function getAllIndicators() {
  return INDIKATORS.flatMap(group => 
    group.subs.map(sub => ({
      ...sub,
      groupNo: group.no,
      groupName: group.nama
    }))
  );
}

/**
 * Calculate score for single indicator
 */
export function calculateSingleScore(indicatorId, value) {
  const indicator = getIndicatorById(indicatorId);
  if (!indicator) return null;

  const pembanding = dataPembanding[indicatorId] || indicator.pembanding;
  const skor = hitungSkor(value, pembanding, indicator.type, indicator.optimalMin, indicator.optimalMax);

  return {
    indicatorId,
    indicatorName: indicator.nama,
    value,
    pembanding,
    skor,
    type: indicator.type,
    bobot: indicator.bobot,
    skorTertimbang: skor * (indicator.bobot / 100)
  };
}

/**
 * Export indicators data
 */
export function exportIndicatorsData(format = 'json') {
  const data = {
    indicators: INDIKATORS,
    scoringConfig: SCORING_CONFIG,
    exportDate: new Date().toISOString()
  };

  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      return convertToCSV(data);
    default:
      return JSON.stringify(data, null, 2);
  }
}

/**
 * Convert indicators to CSV format
 */
function convertToCSV(data) {
  const headers = ['ID', 'Nama', 'Group', 'Bobot', 'Type', 'Pembanding', 'Min', 'Max', 'Satuan', 'Required'];
  const rows = data.indicators.flatMap(group => 
    group.subs.map(sub => [
      sub.id,
      sub.nama,
      group.nama,
      sub.bobot,
      sub.type,
      sub.pembanding,
      sub.min || '',
      sub.max || '',
      sub.satuan,
      sub.required
    ])
  );

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

/**
 * Import indicators data
 */
export function importIndicatorsData(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    
    if (!data.indicators || !Array.isArray(data.indicators)) {
      throw new Error('Invalid indicators data format');
    }

    // Validate imported data
    const validation = validateImportedIndicators(data.indicators);
    if (!validation.isValid) {
      throw new Error(`Validation errors: ${validation.errors.join(', ')}`);
    }

    return data.indicators;

  } catch (error) {
    console.error('Import indicators error:', error);
    throw new Error(`Failed to import indicators: ${error.message}`);
  }
}

/**
 * Validate imported indicators
 */
function validateImportedIndicators(indicators) {
  const errors = [];
  let isValid = true;

  if (!Array.isArray(indicators)) {
    errors.push('Indicators must be an array');
    return { isValid: false, errors };
  }

  indicators.forEach((group, index) => {
    if (!group.no || !group.nama || !group.subs) {
      errors.push(`Group ${index + 1} missing required fields`);
      isValid = false;
    }

    if (group.subs && Array.isArray(group.subs)) {
      group.subs.forEach((sub, subIndex) => {
        if (!sub.id || !sub.nama || sub.bobot === undefined || !sub.type) {
          errors.push(`Group ${index + 1}, Sub ${subIndex + 1} missing required fields`);
          isValid = false;
        }
      });
    }
  });

  return { isValid, errors };
}

/**
 * Get scoring statistics
 */
export function getScoringStatistics(formData) {
  const scores = [];
  const breakdown = calculateComprehensiveScore(formData);

  INDIKATORS.forEach(group => {
    group.subs.forEach(sub => {
      const nilai = formData[sub.id] || 0;
      const pembanding = dataPembanding[sub.id] || sub.pembanding;
      const skor = hitungSkor(nilai, pembanding, sub.type, sub.optimalMin, sub.optimalMax);
      scores.push(skor);
    });
  });

  const validScores = scores.filter(s => s > 0);
  
  return {
    totalIndicators: scores.length,
    validScores: validScores.length,
    averageScore: validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0,
    minScore: validScores.length > 0 ? Math.min(...validScores) : 0,
    maxScore: validScores.length > 0 ? Math.max(...validScores) : 0,
    medianScore: validScores.length > 0 ? calculateMedian(validScores) : 0,
    breakdown
  };
}

/**
 * Calculate median value
 */
function calculateMedian(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}

/**
 * Reset validation state
 */
export function resetValidationState() {
  validationState.errors = {};
  validationState.warnings = {};
  validationState.isValid = false;
  validationState.isDirty = false;
}

/**
 * Get current validation state
 */
export function getValidationState() {
  return { ...validationState };
}

// Initialize module
console.log('🔧 Indicator module initialized with enhanced scoring and validation');