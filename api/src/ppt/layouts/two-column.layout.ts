import { addBullets, LayoutContext } from './helpers';

export function renderTwoColumn({ slide, page, theme }: LayoutContext): void {
  page.background = { color: theme.background };

  page.addShape('roundRect', {
    x: 0.35,
    y: 1.0,
    w: 4.5,
    h: 4.2,
    rectRadius: 0.08,
    line: { color: 'DDE3EA', pt: 1 },
    fill: { color: 'FFFFFF' },
  });

  page.addShape('roundRect', {
    x: 5.15,
    y: 1.0,
    w: 4.5,
    h: 4.2,
    rectRadius: 0.08,
    line: { color: 'DDE3EA', pt: 1 },
    fill: { color: 'FFFFFF' },
  });

  page.addShape('rect', {
    x: 5.0,
    y: 0.45,
    w: 0.03,
    h: 4.75,
    fill: { color: theme.accent },
  });

  page.addText(slide.title, {
    x: 0.4,
    y: 0.4,
    w: 4.5,
    h: 0.7,
    fontSize: 22,
    bold: true,
    color: theme.primary,
  });

  addBullets(page, slide.bullets, { x: 0.55, y: 1.35, w: 4.15, h: 3.7 }, theme.text);

  const colB = slide.columnB!;
  page.addText(colB.title, {
    x: 5.1,
    y: 0.4,
    w: 4.5,
    h: 0.7,
    fontSize: 22,
    bold: true,
    color: theme.primary,
  });

  addBullets(page, colB.bullets, { x: 5.3, y: 1.35, w: 4.15, h: 3.7 }, theme.text);
}
