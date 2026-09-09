export type CategoryFieldDef = {
  key: string;
  label: string;
  placeholder?: string;
};

export const CATEGORY_CUSTOM_FIELDS: Record<string, CategoryFieldDef[]> = {
  books: [
    { key: "isbn", label: "ISBN", placeholder: "e.g. 978-0134685991" },
    { key: "author", label: "Author", placeholder: "e.g. Joshua Bloch" },
  ],
  electronics: [
    { key: "brand", label: "Brand", placeholder: "e.g. Dell, Apple, boAt" },
    { key: "model", label: "Model", placeholder: "e.g. Inspiron 15" },
  ],
  cycles: [
    { key: "brand", label: "Brand", placeholder: "e.g. Hero, Firefox, Trek" },
    { key: "frame_size", label: "Frame size", placeholder: "e.g. 26 inch" },
  ],
  fashion: [{ key: "size", label: "Size", placeholder: "e.g. M, UK 9" }],
  stationery: [
    { key: "subject", label: "Subject / Course", placeholder: "e.g. CS2001, Thermodynamics" },
  ],
  "musical-instruments": [
    { key: "brand", label: "Brand", placeholder: "e.g. Yamaha, Fender" },
    { key: "instrument_type", label: "Type", placeholder: "e.g. Acoustic guitar, Keyboard" },
  ],
  gaming: [
    { key: "platform", label: "Platform", placeholder: "e.g. PS5, Xbox Series X, PC" },
  ],
  vehicles: [
    { key: "brand", label: "Brand", placeholder: "e.g. Honda, TVS" },
    { key: "model", label: "Model", placeholder: "e.g. Activa 6G" },
  ],
  appliances: [{ key: "brand", label: "Brand", placeholder: "e.g. Prestige, Philips" }],
};

export function getCategoryFields(slug: string | undefined | null): CategoryFieldDef[] {
  if (!slug) return [];
  return CATEGORY_CUSTOM_FIELDS[slug] ?? [];
}
