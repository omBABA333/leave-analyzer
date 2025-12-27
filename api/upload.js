import { IncomingForm } from "formidable";
import fs from "fs";

// 1. We must disable the default body parser so 'formidable' can handle the file stream
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2. KEY FIX: Set uploadDir to "/tmp" for Vercel
  const form = new IncomingForm({
    uploadDir: "/tmp",
    keepExtensions: true,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(500).json({ error: "File upload failed" });
    }

    // 3. Handle case where 'files.file' is an array (formidable v3+)
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Success response
    console.log("File saved to:", uploadedFile.filepath);
    return res.status(200).json({
      message: "File uploaded successfully!",
      filename: uploadedFile.originalFilename,
      path: uploadedFile.filepath 
    });
  });
}