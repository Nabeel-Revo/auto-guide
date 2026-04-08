import { parseMedia } from '@remotion/media-parser';
import { nodeReader } from '@remotion/media-parser/node';

export async function getMp3Duration(filePath: string): Promise<number> {
  const result = await parseMedia({
    src: filePath,
    fields: { durationInSeconds: true },
    reader: nodeReader,
    acknowledgeRemotionLicense: true,
  });
  return result.durationInSeconds!;
}
