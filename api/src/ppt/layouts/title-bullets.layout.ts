import { addBullets, LayoutContext } from './helpers';

export function renderTitleBullets({ slide, page, theme }: LayoutContext): void {
  page.background = { color: theme.background };

  page.addText(slide.title, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: theme.primary,
  });

  addBullets(page, slide.bullets, { x: 0.7, y: 1.4, w: 8.6, h: 4.5 }, theme.text);
}
