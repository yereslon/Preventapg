const MAX_LADO_PX = 1200;
const JPEG_QUALITY = 0.72;

export function comprimirImagen(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { naturalWidth: w, naturalHeight: h } = img;
      const escala = Math.min(1, MAX_LADO_PX / Math.max(w, h));
      const ancho = Math.round(w * escala);
      const alto  = Math.round(h * escala);

      const canvas = document.createElement('canvas');
      canvas.width  = ancho;
      canvas.height = alto;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas no disponible')); return; }

      ctx.drawImage(img, 0, 0, ancho, alto);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen'));
    };

    img.src = url;
  });
}

export async function comprimirImagenes(files: FileList | File[]): Promise<string[]> {
  return Promise.all(Array.from(files).map(comprimirImagen));
}
