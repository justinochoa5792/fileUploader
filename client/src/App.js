import { useEffect, useState } from "react";
import Axios from "axios";
import "./App.css";

function App() {
  const [active, setActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [lastFile, setLastFile] = useState(null);
  const [currentChunk, setCurrentChunk] = useState(null);
  const chunkSize = 10 * 1024;

  const handleDrop = (e) => {
    e.preventDefault();
    setFiles([...files, ...e.dataTransfer.files]);
  };

  const uploadCurrentChunk = () => {
    const reader = new FileReader();
    const file = files[currentIndex];
    if (!file) {
      return;
    }
    const from = currentChunk * chunkSize;
    const to = from + chunkSize;
    const blob = file.slice(from, to);
    reader.onload = (e) => uploadChunk(e);
    reader.readAsDataURL(blob);
  };

  const uploadChunk = (readerEvent) => {
    const file = files[currentIndex];
    const data = readerEvent.target.result;
    const params = new URLSearchParams();
    const headers = { "Content-Type": "application/octet-stream" };
    params.set("name", file.name);
    params.set("size", file.size);
    params.set("currentChunkIndex", currentChunk);
    params.set("totalChunks", Math.ceil(file.size / chunkSize));
    Axios.post(`http://localhost:4000/upload?${params.toString()}`, data, {
      headers,
    }).then((response) => {
      const fileSize = files[currentIndex].size;
      const chunks = Math.ceil(fileSize / chunkSize) - 1;
      const isLastChunk = currentChunk === chunks;

      if (isLastChunk) {
        file.finalFilename = response.data.finalFilename;
        setLastFile(currentIndex);
        setCurrentChunk(null);
      } else {
        setCurrentChunk(currentChunk + 1);
      }
    });
  };

  useEffect(() => {
    if (files.length > 0 && currentIndex === null) {
      setCurrentIndex(lastFile === null ? 0 : lastFile + 1);
    }
  }, [files.length]);

  useEffect(() => {
    if (currentIndex !== null) {
      setCurrentChunk(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (currentChunk !== null) {
      uploadCurrentChunk();
    }
  }, [currentChunk]);

  useEffect(() => {
    if (lastFile === null) {
      return;
    }
    const isLastFile = lastFile === files.length - 1;
    const nextFileIndex = isLastFile ? null : currentIndex + 1;
    setCurrentIndex(nextFileIndex);
  }, [lastFile]);

  return (
    <div>
      <div
        className={active ? "dropzone active" : "dropzone"}
        onDragOver={(e) => {
          e.preventDefault();
          setActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setActive(false);
        }}
        onDrop={handleDrop}
      >
        Drop Files Here
      </div>
      <div className="files">
        {files.map((file, fileIndex) => {
          let progress = 0;
          if (file.finalFilename) {
            progress = 100;
          } else {
            const uploading = fileIndex === currentIndex;
            const chunks = Math.ceil(file.size / chunkSize);
            if (uploading) {
              progress = Math.round((currentIndex / chunks) * 100);
            } else {
              progress = 0;
            }
          }
          return (
            <a
              className="file"
              target="_blank"
              href={"http://localhost:4000/uploads/" + file.finalFilename}
            >
              <div className="name">{file.name}</div>
              <div
                className={"progress " + (progress === 100 ? "done" : "")}
                style={{ width: progress + "%" }}
              >
                {progress}%
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default App;
