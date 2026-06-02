import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { PlaceholderProvider } from './providers/placeholder.provider';
import { WanxProvider } from './providers/wanx.provider';

@Module({
  providers: [ImageService, WanxProvider, PlaceholderProvider],
  exports: [ImageService],
})
export class ImageModule {}
