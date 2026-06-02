import { addBullets, addImageIfPresent, LayoutContext } from './helpers';

export function renderCover({ slide, page, theme }: LayoutContext): void {
  if (slide.imagePath) {
    addImageIfPresent(page, slide.imagePath, { x: 0, y: 0, w: 10, h: 5.625 });
    page.addShape('rect', {
      x: 0,
      y: 0,
      w: 10,
      h: 5.625,
      fill: { color: theme.primary, transparency: 55 },
    });
  } else {
    page.background = { color: theme.primary };
  }

  page.addText(slide.title, {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 1.5,
    fontSize: 32,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    fit: 'shrink',
  });

  const subtitle = slide.bullets?.[0];
  if (subtitle) {
    page.addText(subtitle, {
      x: 0.5,
      y: 3.8,
      w: 9,
      h: 0.8,
      fontSize: 16,
      color: 'DCE3EC',
      align: 'center',
      fit: 'shrink',
    });
  }
}
