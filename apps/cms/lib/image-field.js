import React from "react";
import { fields } from "@keystatic/core";
import { MAX_IMAGE_BYTES } from "@portfolio/blog-content/model";

export function imageUploadError(value) {
  if (value == null) return null;
  const bytes = value.data;
  if (!(bytes instanceof Uint8Array) || !bytes.length) return "Choose a valid PNG, JPEG or WebP image.";
  if (bytes.length > MAX_IMAGE_BYTES) return "Image exceeds 5 MiB. Resize or compress it before uploading.";
  const signature = (...expected) => expected.every((byte, index) => bytes[index] === byte);
  const png = value.extension === "png" && signature(137, 80, 78, 71, 13, 10, 26, 10);
  const jpeg = ["jpg", "jpeg"].includes(value.extension) && signature(255, 216, 255);
  const webp = value.extension === "webp" && signature(82, 73, 70, 70) && [87, 69, 66, 80].every((byte, index) => bytes[index + 8] === byte);
  if (!png && !jpeg && !webp) return "Use PNG (.png), JPEG (.jpg/.jpeg) or WebP (.webp), with a matching lowercase extension. SVG and GIF are not supported.";
  return null;
}

export function editorialImageField() {
  const field = fields.image({
    label: "Image file", directory: "content/media", publicPath: "/media/",
    description: "PNG, JPEG or WebP; still image, at most 5 MiB. Save, then open Preview to copy its Markdown reference. Preview and publication also check image integrity.",
  });
  return {
    ...field,
    validate(value) {
      const error = imageUploadError(value);
      if (error) throw new Error(error);
      return field.validate(value);
    },
    Input(props) {
      const error = imageUploadError(props.value);
      return React.createElement(React.Fragment, null,
        React.createElement(field.Input, { ...props, value: error ? null : props.value }),
        error && React.createElement("p", { role: "alert", style: { color: "#b42318" } }, error),
        error && React.createElement("button", { type: "button", onClick: () => props.onChange(null) }, "Remove invalid image"),
      );
    },
  };
}
