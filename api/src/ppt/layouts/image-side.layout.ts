import { addBullets, addImageIfPresent, LayoutContext } from './helpers';

export function renderImageLeft({ slide, page, theme }: LayoutContext): void {
  page.background = { color: theme.background };

  page.addShape('roundRect', {
    x: 4.7,
    y: 1.1,
    w: 4.9,
    h: 4.2,
    rectRadius: 0.08,
    line: { color: 'DDE3EA', pt: 1 },
    fill: { color: 'FFFFFF' },
  });

  addImageIfPresent(
    page,
    slide.imagePath,
    { x: 0.45, y: 1.0, w: 4.1, h: 4.85 },
    false,
  );

  page.addText(slide.title, {
    x: 4.8,
    y: 0.4,
    w: 4.7,
    h: 0.8,
    fontSize: 22,
    bold: true,
    color: theme.primary,
  });

  addBullets(page, slide.bullets, { x: 4.95, y: 1.45, w: 4.4, h: 3.9 }, theme.text);
}

export function renderImageRight({ slide, page, theme }: LayoutContext): void {
  page.background = { color: theme.background };

  page.addShape('roundRect', {
    x: 0.4,
    y: 1.1,
    w: 4.9,
    h: 4.2,
    rectRadius: 0.08,
    line: { color: 'DDE3EA', pt: 1 },
    fill: { color: 'FFFFFF' },
  });

  page.addText(slide.title, {
    x: 0.5,
    y: 0.4,
    w: 4.5,
    h: 0.8,
    fontSize: 22,
    bold: true,
    color: theme.primary,
  });

  addBullets(page, slide.bullets, { x: 0.65, y: 1.45, w: 4.2, h: 3.9 }, theme.text);

  addImageIfPresent(
    page,
    slide.imagePath,
    { x: 5.35, y: 1.0, w: 4.1, h: 4.85 },
    false,
  );
}
