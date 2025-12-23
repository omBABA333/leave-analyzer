import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const form = new formidable.IncomingForm({
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Upload failed" });
    }

    if (!files.file) {
      return res.status(400).json({ error: "No file received" });
    }

    return res.status(200).json({
      message: "File uploaded successfully",
      filename: files.file.originalFilename,
    });
  });
}
