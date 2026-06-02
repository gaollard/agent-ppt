import { addBullets, LayoutContext } from './helpers';

export function renderTitleBullets({ slide, page, theme }: LayoutContext): void {
  page.background = { color: theme.background };

  page.addShape('roundRect', {
    x: 0.4,
    y: 1.1,
    w: 9.2,
    h: 4.2,
    rectRadius: 0.08,
    line: { color: 'D8D2CB', pt: 1 },
    fill: { color: 'FFFFFF' },
  });

  page.addText(slide.title, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.8,
    fontSize: 24,
    bold: true,
    color: theme.primary,
  });

  addBullets(page, slide.bullets, { x: 0.8, y: 1.45, w: 8.2, h: 3.9 }, theme.text);
}
