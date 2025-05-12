import React, { useState } from "react";

const ChatInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max file size
  const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  ];

  const handleSend = async () => {
    if (!message.trim() && !attachment) {
      setFileError("Cannot send an empty message.");
      return;
    }

    let fileData = null;

    if (attachment) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", attachment);

        // Upload file to backend
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL || "http://localhost:8001"}/file/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        const result = await response.json();
        // fileData contains backend file id and metadata
        fileData = {
          id: result.id,
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          // Optionally, you can add a download URL for immediate preview
          url: `${process.env.REACT_APP_BACKEND_URL || "http://localhost:8001"}/file/download/${result.id}`,
        };
      } catch (err) {
        setFileError("Failed to upload file. Please try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSendMessage(message, fileData);
    setMessage("");
    setAttachment(null);
    setFileError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError("");

    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileError("Unsupported file type. Please upload an image, PDF, or document.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({ ...file, base64: reader.result.split(",")[1] });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="react-chatbot-kit-chat-input-container">
      {fileError && <div className="file-error">{fileError}</div>}
      {attachment && (
        <div className="attachment-preview">
          <span>{attachment.name}</span>
          <button onClick={() => setAttachment(null)} className="remove-attachment">
            ×
          </button>
        </div>
      )}
      {uploading && <div className="file-error">Uploading file...</div>}
      <form
        className="react-chatbot-kit-chat-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        {/* Paperclip icon for file upload */}
        <label className="attachment-icon" style={{ cursor: "pointer" }}>
          📎
          <input
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
            tabIndex={-1}
          />
        </label>
        <input
          className="react-chatbot-kit-chat-input"
          placeholder="Write your message here"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="react-chatbot-kit-chat-btn-send" type="submit">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="react-chatbot-kit-chat-btn-send-icon"
          >
            <path d="M476 3.2L12.5 270.6c-18.1 10.4-15.8 35.6 2.2 43.2L121 358.4l287.3-253.2c5.5-4.9 13.3 2.6 8.6 8.3L176 407v80.5c0 23.6 28.5 32.9 42.5 15.8L282 426l124.6 52.2c14.2 6 30.4-2.9 33-18.2l72-432C515 7.8 493.3-6.8 476 3.2z"></path>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
