import { expect, it } from "vitest";
import { imageUploadError, editorialImageField } from "../apps/cms/lib/image-field.js";

it("validates supported image signatures and size before a save", () => {
  expect(imageUploadError(null)).toBeNull();
  for (const [extension, bytes] of [["png", [137, 80, 78, 71, 13, 10, 26, 10]], ["jpg", [255, 216, 255]], ["webp", [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]]]) {
    const value = { data: new Uint8Array(bytes), extension, filename: `image.${extension}` };
    expect(imageUploadError(value)).toBeNull();
    expect(editorialImageField().validate(value)).toEqual(value);
  }
  const invalid = { data: new Uint8Array([71, 73, 70]), extension: "gif", filename: "image.gif" };
  expect(imageUploadError(invalid)).toMatch(/not supported/);
  expect(() => editorialImageField().validate(invalid)).toThrow(/not supported/);
  expect(imageUploadError({ ...invalid, data: new Uint8Array(5 * 1024 * 1024 + 1) })).toMatch(/5 MiB/);
  expect(imageUploadError({ data: new Uint8Array([255, 216, 255]), extension: "png" })).toMatch(/matching/);
});
