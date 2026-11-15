import { jsPDF } from 'jspdf';
import {
  FarmBoundaryEstimate,
  FarmPlot,
  FarmSettings,
  WeatherAlert,
  WeatherForecast,
} from '../types/farm';
import { buildSeasonalCsv, OWAINAT_CENTER, predictCropYield } from '../utils/agronomy';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSeasonalCsvReport(
  plots: FarmPlot[],
  boundary: FarmBoundaryEstimate,
  settings: FarmSettings,
) {
  const csv = buildSeasonalCsv(plots, boundary, settings);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, 'owainat-seasonal-productivity-report.csv');
}

export function exportSeasonalPdfReport(
  plots: FarmPlot[],
  boundary: FarmBoundaryEstimate,
  settings: FarmSettings,
  weather: WeatherForecast,
  alerts: WeatherAlert[],
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(11, 17, 23);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(241, 245, 249);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Owainat AgriTwin — Seasonal Productivity & NASA SMAP Report', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Site: Sharq El Owainat (${OWAINAT_CENTER.lat}° N, ${OWAINAT_CENTER.lng}° E) · ${boundary.aquiferZone} · Generated: ${new Date().toISOString().slice(0, 16)} UTC`,
    14,
    18,
  );

  // KPI summary row
  const predictions = plots.map((p) => predictCropYield(p));
  const totalTons = predictions.reduce((s, r) => s + r.totalPredictedTons, 0);
  const totalWaterM3 = plots.reduce((s, p) => s + p.seasonalWaterUsedM3, 0);
  const totalBaselineM3 = plots.reduce((s, p) => s + p.baselineWaterM3, 0);
  const waterSavedPct = (((totalBaselineM3 - totalWaterM3) / Math.max(1, totalBaselineM3)) * 100).toFixed(1);
  const avgSmapRoot = (
    plots.reduce((s, p) => s + p.smapRootMoisturePct, 0) / Math.max(1, plots.length)
  ).toFixed(1);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const kpis = [
    `Cultivated Area: ${boundary.cultivatedAreaHa} ha / ${boundary.totalConcessionAreaHa} ha`,
    `Predicted Harvest: ${totalTons.toFixed(0)} tons`,
    `Seasonal Water Used: ${(totalWaterM3 / 1000).toFixed(0)}k m³ (-${waterSavedPct}% vs baseline)`,
    `Avg SMAP Root Moisture: ${avgSmapRoot}%`,
    `Daily Aquifer Cap: ${settings.aquiferDailyCapM3.toLocaleString()} m³/d`,
  ];
  doc.text(kpis.join('   |   '), 14, 34);

  // Weather summary
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const alertSummary = alerts.map((a) => `[${a.severity.toUpperCase()}] ${a.title} (${a.metricValue})`).join(' · ');
  doc.text(
    `Local Meteorology (${weather.source}): ${weather.currentTempC}°C (Max ${weather.dailyMaxTempC}°C), Wind ${weather.currentWindKmh} km/h, RH ${weather.currentHumidityPct}% — ${alertSummary}`,
    14,
    40,
    { maxWidth: pageWidth - 28 },
  );

  // Table header
  let y = 50;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  const cols = [
    { label: 'Plot', x: 16 },
    { label: 'Coordinates', x: 30 },
    { label: 'Area (ha)', x: 66 },
    { label: 'Crop', x: 84 },
    { label: 'Status', x: 105 },
    { label: 'SMAP Surf', x: 124 },
    { label: 'SMAP Root', x: 145 },
    { label: 'NDVI', x: 167 },
    { label: 'EC (dS/m)', x: 182 },
    { label: 'Water (m³)', x: 202 },
    { label: 'Yield (t/ha)', x: 225 },
    { label: 'Total (t)', x: 247 },
    { label: 'Score', x: 267 },
  ];

  cols.forEach((c) => doc.text(c.label, c.x, y));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  y += 6;

  plots.forEach((plot, idx) => {
    const pred = predictions[idx];
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4.5, pageWidth - 28, 6.2, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.text(plot.plotCode, 16, y);
    doc.text(`${plot.center.lat.toFixed(4)}, ${plot.center.lng.toFixed(4)}`, 30, y);
    doc.text(plot.areaHectares.toFixed(1), 66, y);
    doc.text(plot.cropType, 84, y);
    doc.text(plot.irrigating ? `${plot.flowRateM3Hr} m³/h` : 'Idle', 105, y);
    doc.text(`${plot.smapSurfaceMoisture.toFixed(2)}`, 124, y);
    doc.text(`${plot.smapRootMoisturePct.toFixed(0)}%`, 145, y);
    doc.text(`${plot.ndvi.toFixed(2)}`, 167, y);
    doc.text(`${plot.soilSalinityDsM.toFixed(1)}`, 182, y);
    doc.text(`${plot.seasonalWaterUsedM3.toLocaleString()}`, 202, y);
    doc.text(`${pred.predictedYieldTHa.toFixed(2)}`, 225, y);
    doc.text(`${pred.totalPredictedTons.toFixed(1)}`, 247, y);
    doc.text(`${pred.sustainabilityScore}/100`, 267, y);
    y += 6.2;
  });

  // Footer note
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Methodology: NASA SMAP L3 surface/root-zone moisture assimilation, Sentinel-2 NDVI canopy vigor, Maas-Hoffman salinity response, and FAO-56 Penman-Monteith ETc.',
    14,
    y + 8,
  );

  doc.save('owainat-seasonal-productivity-report.pdf');
}
