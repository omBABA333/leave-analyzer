import multer from "multer";
import XLSX from "xlsx";

const upload = multer({
  storage: multer.memoryStorage()
});

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  
  upload.single("file")(req, {}, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const workbook = XLSX.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    // BASIC RESPONSE (extend later)
    res.status(200).json({
      totalWorkingDays: data.length,
      records: data
    });
  });
  return res.status(200).json({ message: 'API working' });
}
