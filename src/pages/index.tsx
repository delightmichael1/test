import Head from "next/head";
import getCroppedImg from "@/libs/crop";
import { GrUpdate } from "react-icons/gr";
import EasyCrop from "@/components/cropper";
import { GoUnverified } from "react-icons/go";
import { optimizeImage } from "@/libs/imageCompression";
import { motion, AnimatePresence } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useState, useRef, ChangeEvent, DragEvent } from "react";
import useAxios from "@/hooks/useAxios";
import Select from "@/components/select";

interface OCRResult {
  full_text: string;
  status: string;
}

interface AuthenticityResult {
  is_authentic: boolean;
  confidence: number;
  authenticity_confidence: number;
  status: string;
  document_type: string;
  reasoning: string;
  anomaly_score: number;
  ocr_result: OCRResult;
}

interface VerifyAuthenticityResponse {
  result: AuthenticityResult;
  error: string;
}

export type DocType = {
  name: string;
  aspect: number;
};

const docTypes = [
  {
    name: "Driver's License",
    aspect: 1.5,
  },
  {
    name: "Passport",
    aspect: 4 / 5,
  },
  {
    name: "ID Card",
    aspect: 1.5,
  },
];

export default function Home() {
  const axios = useAxios();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [result, setResult] = useState<VerifyAuthenticityResponse | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocType>(docTypes[0]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const pulseVariants = {
    initial: { scale: 1, opacity: 0.7 },
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file only");
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        setPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (croppedAreaPixels && preview) {
      const imageName = selectedFile.name;
      const croppedImage = await getCroppedImg(preview, croppedAreaPixels);
      if (typeof croppedImage === "string") {
        const optimizedImage = await optimizeImage(
          croppedImage,
          imageName,
          "file"
        );
        if (typeof optimizedImage === "string") return;
        setUploading(true);
        setError(null);

        try {
          const formData = new FormData();
          formData.append("image", optimizedImage as Blob);

          const response = await axios.post("/verify", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          console.log("############", response.data);

          if (!response.data.result.is_authentic) {
            setError(
              response.data.result.reasoning ||
                "Upload failed. Please try again."
            );
          } else {
            setResult(response.data);
          }
        } catch (err: any) {
          setError(
            err.response?.data?.message || "Upload failed. Please try again."
          );
        } finally {
          setUploading(false);
        }
      }
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Head>
        <title>Image Authenticity Verifier</title>
        <meta
          name="description"
          content="Upload and verify image authenticity"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-8 px- text-black">
        <motion.div
          className="max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="text-center mb-8" variants={itemVariants}>
            <motion.h1
              className="text-4xl font-bold text-gray-800 mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              🔍 Document Authenticity Verifier
            </motion.h1>
            <motion.p
              className="text-gray-600 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Upload an image to verify its authenticity using AI-powered
              analysis
            </motion.p>
          </motion.div>

          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20"
            variants={itemVariants}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-full flex items-center justify-between mb-4">
              <span>{selectedDocType.name}</span>
              <Select
                docTypes={docTypes}
                setSelectedDocType={setSelectedDocType}
              />
            </div>
            <motion.div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative overflow-hidden ${
                isDragOver
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400"
              }`}
              initial="idle"
              animate={isDragOver ? "dragOver" : "idle"}
              onDragOver={!preview ? handleDragOver : undefined}
              onDragLeave={!preview ? handleDragLeave : undefined}
              onDrop={!preview ? handleDrop : undefined}
              onClick={!preview ? handleClick : undefined}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <AnimatePresence mode="wait">
                {!preview ? (
                  <motion.div
                    key="upload-prompt"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.svg
                      className="mx-auto h-16 w-16 text-gray-400 mb-6"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      variants={pulseVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                    <motion.h3
                      className="text-xl font-medium text-gray-900 mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Drop your image here or click to browse
                    </motion.h3>
                    <motion.p
                      className="text-gray-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      PNG, JPG, JPEG up to 10MB
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview"
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <div className="relative aspect-video w-full">
                        <EasyCrop
                          image={preview}
                          aspect={selectedDocType.aspect}
                          setCroppedAreaPixels={setCroppedAreaPixels}
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      className="flex gap-4 justify-center flex-col md:flex-row"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpload();
                        }}
                        disabled={uploading}
                        className="bg-gradient-to-r from-blue-600  cursor-pointer to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        {uploading ? (
                          <div className="flex items-center gap-2 w-full justify-center">
                            <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                            Verifying...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 w-full justify-center">
                            <GoUnverified className="w-5 h-5" />
                            Verify Authenticity
                          </div>
                        )}
                      </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                        className="bg-gray-500 hover:bg-gray-600 cursor-pointer flex items-center gap-2 justify-center text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <GrUpdate className="w-4 h-4" />
                        <span>Reset</span>
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex">
                    <motion.svg
                      className="h-5 w-5 text-red-400 mt-0.5 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      initial={{ rotate: -180 }}
                      animate={{ rotate: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </motion.svg>
                    <p className="text-red-800">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {result && (
                <motion.div
                  className="mt-8 space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.h2
                    className="text-3xl font-bold text-gray-800 border-b pb-4 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Verification Results
                  </motion.h2>

                  {result.error ? (
                    <motion.div
                      className="p-6 bg-red-50 border border-red-200 rounded-xl"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h3 className="font-semibold text-red-800 mb-2">
                        ❌ Error
                      </h3>
                      <p className="text-red-700">{result.error}</p>
                    </motion.div>
                  ) : (
                    result.result && (
                      <motion.div
                        className="grid gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <motion.div
                          className={`p-6 rounded-xl border-l-4 ${
                            result.result.is_authentic
                              ? "bg-green-50 border-green-500"
                              : "bg-red-50 border-red-500"
                          }`}
                          variants={itemVariants}
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center mb-3">
                            <motion.div
                              className={`w-6 h-6 rounded-full mr-3 ${
                                result.result.is_authentic
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                delay: 0.5,
                              }}
                            />
                            <h3 className="text-xl font-semibold">
                              {result.result.is_authentic
                                ? "✅ Authentic"
                                : "❌ Not Authentic"}
                            </h3>
                          </div>
                          <p className="text-gray-700 text-lg">
                            Status:{" "}
                            <span className="font-medium">
                              {result.result.status}
                            </span>
                          </p>
                          {result.result.document_type && (
                            <p className="text-gray-700 text-lg">
                              Document Type:{" "}
                              <span className="font-medium">
                                {result.result.document_type}
                              </span>
                            </p>
                          )}
                        </motion.div>

                        <motion.div
                          className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl"
                          variants={itemVariants}
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <h3 className="text-xl font-semibold mb-6 text-center">
                            📈 Confidence Scores
                          </h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            {[
                              {
                                value: result.result.confidence * 100,
                                label: "Document Confidence",
                                color: "blue",
                                icon: "🎯",
                              },
                              {
                                value:
                                  result.result.authenticity_confidence * 100,
                                label: "Authenticity Confidence",
                                color: "green",
                                icon: "✅",
                              },
                            ].map((item, index) => (
                              <motion.div
                                key={item.label}
                                className="text-center p-4 bg-white rounded-xl shadow-md"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                                whileHover={{ y: -4 }}
                              >
                                <div className="text-2xl mb-2">{item.icon}</div>
                                <motion.div
                                  className={`text-3xl font-bold text-${item.color}-600`}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    delay: 0.8 + index * 0.1,
                                  }}
                                >
                                  {item.value.toFixed(1)}%
                                </motion.div>
                                <div className="text-sm text-gray-600 mt-2">
                                  {item.label}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        {result.result.ocr_result && (
                          <motion.div
                            className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl"
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                          >
                            <h3 className="text-xl font-semibold mb-4">
                              📝 OCR Results
                            </h3>
                            <div className="mb-3">
                              <span className="font-medium">Status: </span>
                              <span className="text-gray-700">
                                {result.result.ocr_result.status}
                              </span>
                            </div>
                            {result.result.ocr_result.full_text && (
                              <div>
                                <span className="font-medium">
                                  Extracted Text:
                                </span>
                                <motion.div
                                  className="mt-2 p-4 bg-white rounded-lg border shadow-sm"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  transition={{ delay: 1.4 }}
                                >
                                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                                    {result.result.ocr_result.full_text}
                                  </pre>
                                </motion.div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
