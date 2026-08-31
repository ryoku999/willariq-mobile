import { PresignedEvidenceUpload } from "@/core/entities/incidents.entity";
import { fetch } from "expo/fetch";
import { File } from "expo-file-system";

const apiHost = (() => {
  const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
  if (!baseUrl) return "192.168.101.7";

  try {
    return new URL(baseUrl).hostname;
  } catch {
    return "192.168.101.7";
  }
})();

function getReachableMinioUrl(value: string) {
  const url = new URL(value);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    url.hostname = apiHost;
  }
  return url.toString();
}

export async function uploadEvidenceToMinio(
  upload: PresignedEvidenceUpload,
  file: { uri: string; fileName: string },
) {
  const formData = new FormData();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  for (const [name, value] of Object.entries(upload.fields)) {
    formData.append(name, value);
  }

  formData.append("file", new File(file.uri), file.fileName);

  try {
    const response = await fetch(getReachableMinioUrl(upload.url), {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`MINIO_UPLOAD_FAILED_${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}
