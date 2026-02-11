import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';
import * as unzipper from 'unzipper';

export interface ExtractedFile {
  name: string;
  content: Buffer;
}

export async function extractZipBuffer(zipBuffer: Buffer): Promise<ExtractedFile[]> {
  const files: ExtractedFile[] = [];

  return new Promise((resolve, reject) => {
    const zipStream = stream.Readable.from([zipBuffer]);

    zipStream
      .pipe(unzipper.Parse())
      .on('entry', (entry: any) => {
        const fileName = entry.path;
        const type = entry.type;

        if (type === 'File' && (fileName.endsWith('.pdf') || fileName.endsWith('.PDF'))) {
          const chunks: Buffer[] = [];

          entry
            .on('data', (chunk: any) => {
              chunks.push(chunk as Buffer);
            })
            .on('end', () => {
              files.push({
                name: path.basename(fileName),
                content: Buffer.concat(chunks),
              });
            })
            .on('error', reject);
        } else {
          entry.autodrain();
        }
      })
      .on('end', () => {
        resolve(files);
      })
      .on('error', reject);
  });
}
