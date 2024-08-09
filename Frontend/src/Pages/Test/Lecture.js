import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { updateLectureInfo } from "../../redux/actions";
import "./lecture.css"; // Import CSS file

export default function Lecture({ onCompletion }) {
  const [lectureStarted, setLectureStarted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [audioTimer, setAudioTimer] = useState(0);
  const [paragraphs, setParagraphs] = useState([]);
  const [mode, setMode] = useState("audio"); // State to track the current mode (audio or text)
  const dispatch = useDispatch();
  const speechSynthesisRef = useRef(window.speechSynthesis);
  const playButtonRef = useRef(null);
  const nextButtonRef = useRef(null);
  const replayButtonRef = useRef(null);
  const endLectureButtonRef = useRef(null);
  const [audioPlayEvents, setAudioPlayEvents] = useState([]);

  const isSpeechSynthesisSupported = 'speechSynthesis' in window;

  useEffect(() => {
    handleFetchParagraphs();
  }, []);

  const handleFetchParagraphs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/fetchParagraphs');
      const data = await response.json();
      const listOfParagraphs = data.data.map((item) => ({
        para: item[0]
      }));
      setParagraphs(listOfParagraphs);
    } catch (error) {
      console.error('Failed to fetch Paragraphs:', error);
    }
  };

  const speakText = (text) => {
    if (!isSpeechSynthesisSupported) {
      console.error("SpeechSynthesis API is not supported.");
      return;
    }

    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1; // Set speech properties if needed
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => {
      setAudioPlayEvents((prevEvents) => [...prevEvents, `play - ${audioTimer / 1000}s`]);
    };
    utterance.onend = () => {
      setAudioTimer((prev) => prev + text.length * 50); // Approximate speech time
    };
    speechSynthesisRef.current.speak(utterance);
  };

  const handlePlayButtonClick = () => {
    if (!isSpeechSynthesisSupported) {
      console.error("SpeechSynthesis API is not supported.");
      return;
    }

    const currentText = paragraphs[currentPage]?.para;

    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.resume();
    } else if (speechSynthesisRef.current.paused) {
      speechSynthesisRef.current.resume();
    } else {
      speakText(currentText);
    }
  };

  const handleReplay = () => {
    if (!isSpeechSynthesisSupported) {
      console.error("SpeechSynthesis API is not supported.");
      return;
    }

    const currentText = paragraphs[currentPage]?.para;

    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
    speakText(currentText);
  };

  const toggleMode = () => {
    if (mode === "audio") {
      if (speechSynthesisRef.current.speaking) {
        speechSynthesisRef.current.cancel();
      }
    }
    setMode(mode === "audio" ? "text" : "audio");
  };

  const handleNextPage = () => {
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
    setCurrentPage((prev) => Math.min(prev + 1, paragraphs.length - 1));
  };

  const handlePreviousPage = () => {
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const startLecture = () => {
    setLectureStarted(true);
    if (mode === "audio") {
      const currentText = paragraphs[currentPage]?.para;
      speakText(currentText);
    }
  };

  const startTextLecture = () => {
    setLectureStarted(true);
    setMode("text");
  };

  const endLecture = () => {
    const totalTimeTaken = audioTimer / 1000;
    dispatch(
      updateLectureInfo(
        audioTimer / 1000, // audioTime
        0, // textTime (assuming it's not used in this version)
        totalTimeTaken,
        audioPlayEvents
      )
    );
    onCompletion(totalTimeTaken);
    setLectureStarted(false);
    setAudioTimer(0);
    speechSynthesisRef.current.cancel();
  };

  useEffect(() => {
    if (mode === "text") {
      const interval = setInterval(() => {
        setAudioTimer((prev) => prev + 1000);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [mode]);

  return (
    <div className="mx-auto py-4 px-8">
      <h2 className="text-2xl font-semibold">Lecture</h2>
      <div className="mt-4">
        {!lectureStarted ? (
          <div>
            <h3>Please choose your preferred mode to start the lecture:</h3>
            <button
              onClick={startLecture}
              className="bg-white text-black py-2 px-4 rounded hover:bg-gray-400 border-[1px] border-black transition duration-300 mr-2"
            >
              Start with Audio
            </button>
            <button
              onClick={startTextLecture}
              className="bg-white text-black py-2 px-4 rounded hover:bg-gray-400 border-[1px] border-black transition duration-300"
            >
              Start with Text
            </button>
          </div>
        ) : (
          <div>
            {mode === "audio" ? (
              <div>
                <div className="audio-container">
                  <button
                    ref={playButtonRef}
                    onClick={handlePlayButtonClick}
                    className="play-pause-button"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "5px",
                      backgroundColor: "#FFFFFF",
                      color: "#000000",
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                  >
                    {speechSynthesisRef.current.paused ||
                    !speechSynthesisRef.current.speaking
                      ? "▶"
                      : "⏸"}
                  </button>
                  <button
                    ref={replayButtonRef}
                    onClick={handleReplay}
                    aria-label="Replay Audio"
                  >
                    Replay
                  </button>
                </div>
                <div>
                  <div>
                    {paragraphs[currentPage] && (
                      <div
                        style={{
                          position: "absolute",
                          top: "4rem",
                          right: 0,
                          padding: "0.5rem",
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                          borderRadius: "0 0 0.25rem 0.25rem",
                        }}
                      >
                        Audio Time: {Math.floor(audioTimer / 1000)}s
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    onClick={toggleMode}
                    className="bg-white text-black py-2 px-4 rounded hover:bg-gray-400 border-[1px] border-black transition duration-300"
                  >
                    Text Mode
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button className="bg-white text-black py-2 px-4 rounded hover:bg-gray-400 border-[1px] border-black transition duration-300 mt-2">
                  Paragraph - {currentPage + 1}
                </button>
                <br />
                <p>{paragraphs[currentPage]?.para}</p>
                <div className="mt-2">
                  <button
                    onClick={toggleMode}
                    className="bg-white text-black py-2 px-4 rounded hover:bg-gray-400 border-[1px] border-black transition duration-300"
                  >
                    Audio Mode
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {lectureStarted && (
        <div className="mt-2">
          {currentPage !== 0 && (
            <button
              onClick={handlePreviousPage}
              className="bg-white text-black py-2 px-4 rounded hover:bg-gray-400 border-[1px] border-black transition duration-300 mr-2"
            >
              Back
            </button>
          )}
          {currentPage !== paragraphs.length - 1 && (
            <button
              ref={nextButtonRef}
              onClick={handleNextPage}
              className="bg-white text-black py-2 px-4 rounded hover:bg-gray-400 border-[1px] border-black transition duration-300"
            >
              Next
            </button>
          )}
          <button
            ref={endLectureButtonRef}
            onClick={endLecture}
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 border-[1px] border-red-700 transition duration-300"
          >
            End Lecture
          </button>
        </div>
      )}
    </div>
  );
}
