import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/** Fora de public/: em produção o Next só serve arquivos de public/ existentes no build. */
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const UPLOAD_NAME_RE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;
export const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Salva a foto em uploads/ e devolve a URL pública. null se não houver arquivo. */
export async function saveImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = EXT[file.type];
  if (!ext) throw new Error("Formato de imagem não suportado (use JPG, PNG ou WEBP).");
  if (file.size > MAX_BYTES) throw new Error("A foto deve ter no máximo 5 MB.");
  const dir = UPLOAD_DIR;
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
