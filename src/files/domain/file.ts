import { Transform } from 'class-transformer';
import { Allow } from 'class-validator';
import fileConfig from '../config/file-config';
import { FileConfig, FileDriver } from '../config/file-config.type';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MaybeType } from 'src/utils/types/maybe.type';
import { AppConfig } from '../../config/app-config.type';
import appConfig from '../../config/app.config';

export class FileType {
  @Allow()
  id: string;

  @Transform(
    async ({ value }) => {
      if ((fileConfig() as FileConfig).driver === FileDriver.LOCAL) {
        return (appConfig() as AppConfig).backendDomain + value;
      } else if (
        [FileDriver.S3_PRESIGNED, FileDriver.S3].includes(
          (fileConfig() as FileConfig).driver,
        )
      ) {
        const s3 = new S3Client({
          region: (fileConfig() as FileConfig).awsS3Region ?? '',
          credentials: {
            accessKeyId: (fileConfig() as FileConfig).accessKeyId ?? '',
            secretAccessKey: (fileConfig() as FileConfig).secretAccessKey ?? '',
          },
        });

        const command = new GetObjectCommand({
          Bucket: (fileConfig() as FileConfig).awsDefaultS3Bucket ?? '',
          Key: value as MaybeType<string>,
        });

        return await getSignedUrl(s3, command, { expiresIn: 3600 });
      }

      return value as string;
    },
    {
      toPlainOnly: true,
    },
  )
  path: string;
}
