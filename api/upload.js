import { IncomingForm } from "formidable";
import * as XLSX from "xlsx";
import fs from "fs";

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new IncomingForm({
    uploadDir: "/tmp",
    keepExtensions: true,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "File upload failed" });
    }

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      // 1. Read the file from /tmp
      const workbook = XLSX.readFile(uploadedFile.filepath);
      
      // 2. Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // 3. Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 4. Send the parsed data back to frontend
      return res.status(200).json({
        message: "File processed successfully",
        totalRecords: jsonData.length,
        data: jsonData // We are sending the raw Excel data back to you to check
      });

    } catch (error) {
      console.error("Excel processing error:", error);
      return res.status(500).json({ error: "Failed to parse Excel file" });
    }
  });
}