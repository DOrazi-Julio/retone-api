import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileRepository } from '../../persistence/file.repository';
import { FileType } from '../../../domain/file';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesS3Service {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService,
  ) {}

  async findById(id: FileType['id']): Promise<FileType | null> {
    return this.fileRepository.findById(id);
  }

  async findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    return this.fileRepository.findByIds(ids);
  }

  async downloadFileAsText(fileIdOrUrl: string): Promise<string> {
    const file = await this.fileRepository.findById(fileIdOrUrl);
    if (!file) throw new Error('File not found');
    // Aquí podrías agregar lógica para descargar el archivo desde S3 si lo necesitas
    return file.path;
  }
  async uploadTextFile(
    path: string,
    text: string,
  ): Promise<{ file: FileType }> {
    const bucket = this.configService.get<string>('file.awsDefaultS3Bucket', {
      infer: true,
    });
    const region = this.configService.get<string>('file.awsS3Region', {
      infer: true,
    });
    const accessKeyId = this.configService.get<string>('file.accessKeyId', {
      infer: true,
    });
    const secretAccessKey = this.configService.get<string>(
      'file.secretAccessKey',
      { infer: true },
    );
    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3 credentials are missing: accessKeyId or secretAccessKey',
      );
    }
    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: text,
        ContentType: 'text/plain',
      }),
    );
    // Registrar el path en la base de datos y retornar el objeto completo
    const file = await this.fileRepository.create({ path });
    return { file };
  }

  async create(file: Express.MulterS3.File): Promise<{ file: FileType }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'selectFile',
        },
      });
    }

    return {
      file: await this.fileRepository.create({
        path: file.key,
      }),
    };
  }

  async downloadFileContent(fileId: string): Promise<string> {
    const file = await this.fileRepository.findById(fileId);
    if (!file) throw new Error('File not found');
    const bucket = this.configService.get<string>('file.awsDefaultS3Bucket', {
      infer: true,
    });
    const region = this.configService.get<string>('file.awsS3Region', {
      infer: true,
    });
    const accessKeyId = this.configService.get<string>('file.accessKeyId', {
      infer: true,
    });
    const secretAccessKey = this.configService.get<string>(
      'file.secretAccessKey',
      { infer: true },
    );
    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'S3 credentials are missing: accessKeyId or secretAccessKey',
      );
    }
    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: file.path,
      }),
    );
    const stream = response.Body as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf-8');
  }
}
