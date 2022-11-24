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
    setFiles([...files, ...e.dataTranser.files]);
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
    const file = files(currentIndex);
    const data = readerEvent.target.result;
    const params = new URLSearchParams();
    const headers = { "Content-Type": "application/octet-stream" };
    params.set("name", file.name);
    params.set("size", file.size);
    params.set("currentChunkIndex", currentChunk);
    params.set("totalChunks", Math.ceil(file.size / chunkSize));
    Axios.post(`https://localhost:4000/upload?${params.toString()}`, data, {
      headers,
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

  return (
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
  );
}

export default App;
