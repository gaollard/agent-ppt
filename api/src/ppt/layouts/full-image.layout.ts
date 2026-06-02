import { addImageIfPresent, LayoutContext } from './helpers';

export function renderFullImage({ slide, page, theme }: LayoutContext): void {
  if (slide.imagePath) {
    addImageIfPresent(page, slide.imagePath, { x: 0, y: 0, w: 10, h: 5.625 });
    page.addShape('rect', {
      x: 0,
      y: 4.0,
      w: 10,
      h: 1.625,
      fill: { color: theme.primary, transparency: 40 },
    });
  } else {
    page.background = { color: theme.primary };
  }

  page.addText(slide.title, {
    x: 0.5,
    y: 4.3,
    w: 9,
    h: 1.0,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
    fit: 'shrink',
  });

  const subtitle = slide.bullets?.[0];
  if (subtitle) {
    page.addText(subtitle, {
      x: 0.5,
      y: 5.0,
      w: 9,
      h: 0.5,
      fontSize: 14,
      color: 'DCE3EC',
      fit: 'shrink',
    });
  }
}
