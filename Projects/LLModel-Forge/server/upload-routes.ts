import { Router, Request, Response } from "express";
import multer from "multer";
import { authMiddleware, type AuthRequest } from "./auth";
import { fileStorage } from "./file-storage";
import { storage } from "./storage";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_MODEL_SIZE_MB || "500") * 1024 * 1024, // Default 500MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = [
      ".pkl", ".joblib", ".pt", ".pth", ".h5", ".onnx", ".pb",
      ".json", ".yaml", ".yml", ".csv", ".parquet", ".zip", ".tar", ".gz"
    ];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed: ${allowedExtensions.join(", ")}`));
    }
  },
});

// Upload model file
router.post(
  "/models/:modelId/upload",
  authMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { modelId } = req.params;
      const { version } = req.body;

      const model = await storage.getModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }

      const result = await fileStorage.uploadModel(
        req.file.buffer,
        req.file.originalname,
        req.user!.id,
        modelId,
        version || model.version || "1.0.0"
      );

      if (!result) {
        return res.status(500).json({ error: "File storage not configured" });
      }

      // Update model with file path
      await storage.updateModel(modelId, {
        modelPath: result.key,
      });

      res.json({
        success: true,
        file: {
          key: result.key,
          size: result.size,
          contentType: result.contentType,
          downloadUrl: result.url,
        },
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  }
);

// Download model file
router.get(
  "/models/:modelId/download",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { modelId } = req.params;
      const model = await storage.getModel(modelId);

      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }

      if (!model.modelPath) {
        return res.status(404).json({ error: "No file associated with this model" });
      }

      const downloadUrl = await fileStorage.getPresignedUrl("models", model.modelPath);

      if (!downloadUrl) {
        return res.status(500).json({ error: "File storage not configured" });
      }

      res.json({ downloadUrl, expiresIn: 3600 });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Download failed" });
    }
  }
);

// List model files
router.get(
  "/models/:modelId/files",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { modelId } = req.params;
      const files = await fileStorage.listModelFiles(modelId);
      res.json({ files });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to list files" });
    }
  }
);

// Delete model file
router.delete(
  "/models/:modelId/files/:fileKey",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { modelId, fileKey } = req.params;
      const success = await fileStorage.deleteFile("models", `${modelId}/${fileKey}`);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete file" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Delete failed" });
    }
  }
);

// Upload dataset
router.post(
  "/datasets/upload",
  authMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const result = await fileStorage.uploadDataset(
        req.file.buffer,
        req.file.originalname,
        req.user!.id
      );

      if (!result) {
        return res.status(500).json({ error: "File storage not configured" });
      }

      res.json({
        success: true,
        file: {
          key: result.key,
          size: result.size,
          contentType: result.contentType,
          downloadUrl: result.url,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  }
);

// Upload experiment artifact
router.post(
  "/experiments/:experimentId/artifacts",
  authMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { experimentId } = req.params;

      const result = await fileStorage.uploadArtifact(
        req.file.buffer,
        req.file.originalname,
        experimentId
      );

      if (!result) {
        return res.status(500).json({ error: "File storage not configured" });
      }

      res.json({
        success: true,
        artifact: {
          key: result.key,
          size: result.size,
          contentType: result.contentType,
          downloadUrl: result.url,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  }
);

// Get storage stats
router.get(
  "/storage/stats",
  authMiddleware,
  async (_req: AuthRequest, res: Response) => {
    res.json({
      isConfigured: fileStorage.isReady(),
      maxUploadSize: `${process.env.MAX_MODEL_SIZE_MB || 500}MB`,
    });
  }
);

export default router;

