import type { LocalIncidentEvidence } from "@/core/entities/incidents.entity";
import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";

const EVIDENCE_DIRECTORY = new Directory(Paths.document, "incident-evidence");
const MAX_IMAGE_SIDE = 1920;
const TARGET_SIZE = 1024 * 1024;
const MAX_FILE_SIZE = 5 * TARGET_SIZE;
const JPEG_QUALITIES = [0.8, 0.68, 0.55] as const;

export async function prepareIncidentImage(
  asset: ImagePickerAsset,
  capturedAt?: string,
): Promise<LocalIncidentEvidence> {
  const context = ImageManipulator.manipulate(asset.uri);
  let best: File | undefined;
  try {
    if (Math.max(asset.width, asset.height) > MAX_IMAGE_SIDE) {
      context.resize(
        asset.width >= asset.height
          ? { width: MAX_IMAGE_SIDE, height: null }
          : { width: null, height: MAX_IMAGE_SIDE },
      );
    }
    const rendered = await context.renderAsync();
    try {
      for (const compress of JPEG_QUALITIES) {
        try {
          const result = await rendered.saveAsync({
            compress,
            format: SaveFormat.JPEG,
          });
          const candidate = new File(result.uri);
          if (candidate.size > 0 && (!best || candidate.size < best.size)) {
            const previous = best;
            best = candidate;
            if (previous) deleteIncidentImage(previous.uri);
          } else {
            deleteIncidentImage(candidate.uri);
          }
          if (best && best.size <= TARGET_SIZE) break;
        } catch (error) {
          if (!best || best.size > MAX_FILE_SIZE) throw error;
          break;
        }
      }
    } finally {
      rendered.release();
    }

    if (!best) throw new Error("IMAGE_EMPTY");
    if (best.size > MAX_FILE_SIZE) throw new Error("FILE_SIZE_EXCEEDED");

    EVIDENCE_DIRECTORY.create({ idempotent: true, intermediates: true });
    const localId = Crypto.randomUUID();
    const fileName = "evidencia-" + localId + ".jpg";
    const destination = new File(EVIDENCE_DIRECTORY, fileName);
    const sizeBytes = best.size;
    try {
      await best.copy(destination);
      return {
        localId,
        uri: destination.uri,
        fileName,
        mimeType: "image/jpeg",
        sizeBytes,
        capturedAt,
        status: "queued",
      };
    } catch (error) {
      deleteIncidentImage(destination.uri);
      throw error;
    }
  } finally {
    context.release();
    if (best) deleteIncidentImage(best.uri);
  }
}

export function deleteIncidentImage(uri: string) {
  const file = new File(uri);
  if (file.exists) file.delete();
}
