import PptxGenJS from 'pptxgenjs';
import { LayoutContext } from './helpers';

const CHART_TYPES: Record<string, PptxGenJS.CHART_NAME> = {
  bar: 'bar',
  line: 'line',
  pie: 'pie',
};

export function renderChart({ slide, page, theme }: LayoutContext): void {
  page.background = { color: theme.background };

  page.addText(slide.title, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.7,
    fontSize: 26,
    bold: true,
    color: theme.primary,
  });

  const chart = slide.chart!;
  const chartType = CHART_TYPES[chart.type] ?? 'bar';

  page.addChart(
    chartType,
    [
      {
        name: slide.title,
        labels: chart.labels,
        values: chart.values,
      },
    ],
    {
      x: 0.5,
      y: 1.0,
      w: 9,
      h: 4.3,
      chartColors: [theme.accent, theme.primary, '64748B', '94A3B8'],
      showLegend: false,
      showTitle: false,
    },
  );
}
