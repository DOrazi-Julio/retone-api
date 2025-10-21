import { Injectable, Optional } from '@nestjs/common';
import { FilesLocalService } from './infrastructure/uploader/local/files.service';
import { FilesS3Service } from './infrastructure/uploader/s3/files.service';
import fileConfig from './config/file.config';
import { FileConfig, FileDriver } from './config/file-config.type';
import { FileRepository } from './infrastructure/persistence/file.repository';
import { FileType } from './domain/file';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class FilesService {
  constructor(
    private readonly fileRepository: FileRepository,
    @Optional() private readonly filesLocalService?: FilesLocalService,
    @Optional() private readonly filesS3Service?: FilesS3Service,
  ) {}

  findById(id: FileType['id']): Promise<NullableType<FileType>> {
    return this.fileRepository.findById(id);
  }

  findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    return this.fileRepository.findByIds(ids);
  }

  async uploadTextFile(path: string, text: string): Promise<string> {
    const driver = (fileConfig() as FileConfig).driver;
    if (driver === FileDriver.LOCAL) {
      if (!this.filesLocalService) throw new Error('FilesLocalService not available');
      const file: Partial<Express.Multer.File> = {
        originalname: 'input.txt',
        mimetype: 'text/plain',
        buffer: Buffer.from(text, 'utf-8'),
        path,
      } as Express.Multer.File;
      const { file: createdFile } = await this.filesLocalService.create(file as Express.Multer.File);
      return createdFile.id;
    } else if (driver === FileDriver.S3) {
      if (!this.filesS3Service) throw new Error('FilesS3Service not available');
      // Implementación para S3: subir archivo como texto
      const { file: createdFile } = await this.filesS3Service.uploadTextFile(path, text);
      return createdFile.id;
    } else {
      throw new Error('Unsupported file driver');
    }
  }

async downloadFileAsText(fileIdOrUrl: string): Promise<string> {
  const driver = (fileConfig() as FileConfig).driver;
  if (driver === FileDriver.LOCAL) {
    const file = await this.fileRepository.findById(fileIdOrUrl);
    if (!file) throw new Error('File not found');
    // Aquí podrías leer el archivo del disco si lo necesitas, por ahora retorna el path
    return file.path;
  } else if (driver === FileDriver.S3) {
    if (!this.filesS3Service) throw new Error('FilesS3Service not available');
    // Descarga el contenido real del archivo desde S3
    return await this.filesS3Service.downloadFileContent(fileIdOrUrl);
  } else {
    throw new Error('Unsupported file driver');
  }
}
}
