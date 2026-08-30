import { LocalIncidentEvidence } from "@/core/entities/incidents.entity";
import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";

const EVIDENCE_DIRECTORY = new Directory(Paths.document, "incident-evidence");
const MAX_IMAGE_WIDTH = 1920;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function prepareIncidentImage(
  asset: ImagePickerAsset,
  capturedAt?: string,
): Promise<LocalIncidentEvidence> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > MAX_IMAGE_WIDTH) {
    context.resize({ width: MAX_IMAGE_WIDTH, height: null });
  }

  const rendered = await context.renderAsync();
  const optimized = await rendered.saveAsync({
    compress: 0.8,
    format: SaveFormat.JPEG,
  });

  EVIDENCE_DIRECTORY.create({ idempotent: true, intermediates: true });
  const localId = Crypto.randomUUID();
  const fileName = `evidencia-${localId}.jpg`;
  const source = new File(optimized.uri);
  const destination = new File(EVIDENCE_DIRECTORY, fileName);
  await source.copy(destination);

  if (destination.size > MAX_FILE_SIZE) {
    destination.delete();
    throw new Error("IMAGE_TOO_LARGE");
  }

  return {
    localId,
    uri: destination.uri,
    fileName,
    mimeType: "image/jpeg",
    sizeBytes: destination.size,
    capturedAt,
    status: "queued",
  };
}

export function deleteIncidentImage(uri: string) {
  const file = new File(uri);
  if (file.exists) file.delete();
}
