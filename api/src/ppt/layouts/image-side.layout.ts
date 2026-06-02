import { addBullets, addImageIfPresent, LayoutContext } from './helpers';

export function renderImageLeft({ slide, page, theme }: LayoutContext): void {
  page.background = { color: theme.background };

  addImageIfPresent(
    page,
    slide.imagePath,
    { x: 0.3, y: 1.0, w: 4.2, h: 4.8 },
    true,
  );

  page.addText(slide.title, {
    x: 4.8,
    y: 0.4,
    w: 4.7,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: theme.primary,
  });

  addBullets(page, slide.bullets, { x: 4.8, y: 1.4, w: 4.7, h: 4.5 }, theme.text);
}

export function renderImageRight({ slide, page, theme }: LayoutContext): void {
  page.background = { color: theme.background };

  page.addText(slide.title, {
    x: 0.5,
    y: 0.4,
    w: 4.5,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: theme.primary,
  });

  addBullets(page, slide.bullets, { x: 0.5, y: 1.4, w: 4.5, h: 4.5 }, theme.text);

  addImageIfPresent(
    page,
    slide.imagePath,
    { x: 5.2, y: 1.0, w: 4.3, h: 4.8 },
    true,
  );
}
