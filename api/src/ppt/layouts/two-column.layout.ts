import { addBullets, LayoutContext } from './helpers';

export function renderTwoColumn({ slide, page, theme }: LayoutContext): void {
  page.background = { color: theme.background };

  page.addShape('rect', {
    x: 5.0,
    y: 0.3,
    w: 0.03,
    h: 5.0,
    fill: { color: theme.accent },
  });

  page.addText(slide.title, {
    x: 0.4,
    y: 0.4,
    w: 4.5,
    h: 0.7,
    fontSize: 24,
    bold: true,
    color: theme.primary,
  });

  addBullets(page, slide.bullets, { x: 0.4, y: 1.2, w: 4.5, h: 4.3 }, theme.text);

  const colB = slide.columnB!;
  page.addText(colB.title, {
    x: 5.1,
    y: 0.4,
    w: 4.5,
    h: 0.7,
    fontSize: 24,
    bold: true,
    color: theme.primary,
  });

  addBullets(page, colB.bullets, { x: 5.1, y: 1.2, w: 4.5, h: 4.3 }, theme.text);
}
