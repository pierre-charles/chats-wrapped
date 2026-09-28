import { parseChatFile } from "./parser";
import { FileInputSchema } from "./schemas";

export function handleFileUpload(file: File) {
  const validation = FileInputSchema.safeParse({
    name: file.name,
    size: file.size
  });

  if (!validation.success) {
    return Promise.resolve({
      success: false as const,
      error: validation.error.issues[0].message
    });
  }

  return file.text().then((content) => parseChatFile(content));
}
