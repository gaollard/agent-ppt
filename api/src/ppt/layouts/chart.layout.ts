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
    y: 0.35,
    w: 9,
    h: 0.7,
    fontSize: 23,
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
      y: 1.05,
      w: 9,
      h: 4.15,
      chartColors: [theme.primary, theme.accent, '7A8A9A', 'B8C4D1'],
      showLegend: false,
      showTitle: false,
    },
  );
}
