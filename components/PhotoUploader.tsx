"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/LanguageProvider";

const MAX_ORIGINAL_SIZE = 50 * 1024 * 1024;
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const MAX_DIMENSION = 3000;

function isHeicFile(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

async function convertHeicToJpeg(
  file: File
): Promise<File> {
  const heic2any = (
    await import("heic2any")
  ).default;

  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  const blob = Array.isArray(result)
    ? result[0]
    : result;

  if (!blob) {
    throw new Error(
      "Impossible de convertir cette photo HEIC."
    );
  }

  const originalName = file.name.replace(
    /\.(heic|heif)$/i,
    ""
  );

  return new File(
    [blob],
    `${originalName}.jpg`,
    {
      type: "image/jpeg",
      lastModified: Date.now(),
    }
  );
}

async function compressImage(
  originalFile: File
): Promise<File> {
  let file = originalFile;

  // Les fichiers HEIC/HEIF sont d'abord convertis
  // en JPEG directement dans le navigateur.
  if (isHeicFile(file)) {
    file = await convertHeicToJpeg(file);
  }

  let image: ImageBitmap;

  try {
    image = await createImageBitmap(file);
  } catch {
    throw new Error(
      "Impossible de lire cette photo. Essayez une autre image."
    );
  }

  let width = image.width;
  let height = image.height;

  if (
    width > MAX_DIMENSION ||
    height > MAX_DIMENSION
  ) {
    const ratio = Math.min(
      MAX_DIMENSION / width,
      MAX_DIMENSION / height
    );

    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    image.close();

    throw new Error(
      "Impossible de traiter cette photo."
    );
  }

  ctx.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  image.close();

  let quality = 0.9;
  let blob: Blob | null = null;

  while (quality >= 0.5) {
    blob = await new Promise<Blob | null>(
      (resolve) => {
        canvas.toBlob(
          (result) => resolve(result),
          "image/jpeg",
          quality
        );
      }
    );

    if (!blob) {
      throw new Error(
        "Impossible de compresser cette photo."
      );
    }

    if (blob.size <= MAX_UPLOAD_SIZE) {
      break;
    }

    quality -= 0.1;
  }

  if (
    !blob ||
    blob.size > MAX_UPLOAD_SIZE
  ) {
    throw new Error(
      "Cette photo reste trop volumineuse après optimisation."
    );
  }

  const originalName =
    originalFile.name.replace(
      /\.[^.]+$/,
      ""
    );

  return new File(
    [blob],
    `${originalName}.jpg`,
    {
      type: "image/jpeg",
      lastModified: Date.now(),
    }
  );
}

export default function PhotoUploader() {
  const { t, lang } = useLanguage();

  const [name, setName] = useState("");
  const [caption, setCaption] =
    useState("");
  const [file, setFile] =
    useState<File | null>(null);
  const [status, setStatus] =
    useState("");
  const [uploading, setUploading] =
    useState(false);

  async function upload() {
    if (!file) {
      setStatus(
        lang === "fr"
          ? "Veuillez sélectionner une photo."
          : "Please select a photo."
      );

      return;
    }

    if (file.size > MAX_ORIGINAL_SIZE) {
      setStatus(
        lang === "fr"
          ? "Cette photo dépasse la limite de 50 Mo."
          : "This photo exceeds the 50 MB limit."
      );

      return;
    }

    try {
      setUploading(true);

      if (isHeicFile(file)) {
        setStatus(
          lang === "fr"
            ? "Conversion de votre photo iPhone…"
            : "Converting your iPhone photo…"
        );
      } else {
        setStatus(
          lang === "fr"
            ? "Optimisation de votre photo…"
            : "Optimizing your photo…"
        );
      }

      const optimizedFile =
        await compressImage(file);

      setStatus(
        lang === "fr"
          ? "Envoi de votre photo…"
          : "Uploading your photo…"
      );

      const supabase = createClient();

      const safeName =
        optimizedFile.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        );

      const path =
        `${crypto.randomUUID()}-${safeName}`;

      const uploadResult =
        await supabase.storage
          .from("wedding-photos")
          .upload(path, optimizedFile, {
            contentType:
              optimizedFile.type,
          });

      if (uploadResult.error) {
        setStatus(
          uploadResult.error.message
        );

        return;
      }

      const row = await supabase
        .from("photos")
        .insert({
          guest_name:
            name.trim() ||
            (lang === "fr"
              ? "Invité"
              : "Guest"),

          caption:
            caption.trim() || null,

          storage_path: path,

          approved: false,
        });

      if (row.error) {
        await supabase.storage
          .from("wedding-photos")
          .remove([path]);

        setStatus(row.error.message);

        return;
      }

      setName("");
      setCaption("");
      setFile(null);

      setStatus(t.photoThanks);

      const input =
        document.getElementById(
          "wedding-photo-input"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }
    } catch (error) {
      console.error(
        "Photo upload error:",
        error
      );

      setStatus(
        error instanceof Error
          ? error.message
          : t.genericError
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="card form">
      <div className="field">
        <label>{t.yourName}</label>

        <input
          className="input"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />
      </div>

      <div className="field">
        <label>{t.caption}</label>

        <input
          className="input"
          value={caption}
          onChange={(e) =>
            setCaption(e.target.value)
          }
        />
      </div>

      <div className="field">
        <label>{t.photo}</label>

        <input
          id="wedding-photo-input"
          className="input"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
          disabled={uploading}
          onChange={(e) => {
            const selected =
              e.target.files?.[0] ||
              null;

            setStatus("");

            if (
              selected &&
              selected.size >
                MAX_ORIGINAL_SIZE
            ) {
              setFile(null);

              setStatus(
                lang === "fr"
                  ? "Cette photo dépasse la limite de 50 Mo."
                  : "This photo exceeds the 50 MB limit."
              );

              e.target.value = "";

              return;
            }

            setFile(selected);
          }}
        />

        <p
          className="muted"
          style={{
            fontSize: 13,
            marginTop: 8,
          }}
        >
          {lang === "fr"
            ? "JPG, PNG, WebP, HEIC ou HEIF · jusqu'à 50 Mo. Les photos seront automatiquement optimisées avant l'envoi."
            : "JPG, PNG, WebP, HEIC or HEIF · up to 50 MB. Photos will automatically be optimized before upload."}
        </p>
      </div>

      {file && !uploading && (
        <div
          className="muted"
          style={{
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {file.name} ·{" "}
          {(
            file.size /
            1024 /
            1024
          ).toFixed(1)}{" "}
          Mo
        </div>
      )}

      <button
        type="button"
        className="btn btnDark"
        style={{ width: "100%" }}
        onClick={upload}
        disabled={uploading}
      >
        {uploading
          ? lang === "fr"
            ? "Traitement en cours…"
            : "Processing…"
          : t.sharePhoto}
      </button>

      {status && (
        <div className="notice">
          {status}
        </div>
      )}
    </div>
  );
}