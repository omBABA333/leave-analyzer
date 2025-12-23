import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const form = new formidable.IncomingForm({
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(500).json({ error: "File parsing failed" });
      }

      const uploadedFile = files.file;

      if (!uploadedFile) {
        return res.status(400).json({ error: "No file received" });
      }

      return res.status(200).json({
        message: "File uploaded successfully",
        filename: uploadedFile.originalFilename,
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
