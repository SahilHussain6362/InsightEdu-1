import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { updateLectureInfo } from "../../redux/actions";
import "./lecture.css"; // Import CSS file

export default function Lecture({ onCompletion }) {
  const [lectureStarted, setLectureStarted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [audioTimer, setAudioTimer] = useState(0);
  const [textTimer, setTextTimer] = useState(0); // New state for text timer
  const [paragraphs, setParagraphs] = useState([]);
  const [mode, setMode] = useState("audio"); // State to track the current mode (audio or text)
  const [isPaused, setIsPaused] = useState(false); // New state to track pause status
  const [audioTimes, setAudioTimes] = useState([0, 0, 0, 0, 0]); // Array to track individual audio times
  const [textTimes, setTextTimes] = useState([0, 0, 0, 0, 0]); // Array to track individual text times
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
      setAudioTimer((prev) => {
        const newTime = prev + text.length * 50; // Approximate speech time
        updateAudioTime(newTime);
        return newTime;
      });
    };
    speechSynthesisRef.current.speak(utterance);
  };

  const updateAudioTime = (time) => {
    setAudioTimes((prevTimes) => {
      const updatedTimes = [...prevTimes];
      updatedTimes[currentPage] += time - audioTimer;
      return updatedTimes;
    });
  };

  const updateTextTime = () => {
    setTextTimes((prevTimes) => {
      const updatedTimes = [...prevTimes];
      updatedTimes[currentPage] += 1000;
      return updatedTimes;
    });
  };

  const handlePlayButtonClick = () => {
    if (!isSpeechSynthesisSupported) {
      console.error("SpeechSynthesis API is not supported.");
      return;
    }

    const currentText = paragraphs[currentPage]?.para;

    if (speechSynthesisRef.current.speaking) {
      if (isPaused) {
        speechSynthesisRef.current.resume();
        setIsPaused(false);
      } else {
        speechSynthesisRef.current.pause();
        setIsPaused(true);
      }
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
    const totalTextTime = textTimer / 1000;
    dispatch(
      updateLectureInfo(
        audioTimer / 1000, // audioTime
        textTimer / 1000, // textTime
        totalTimeTaken,
        audioPlayEvents
      )
    );
    onCompletion(totalTimeTaken);
    setLectureStarted(false);
    setAudioTimer(0);
    setTextTimer(0);
    speechSynthesisRef.current.cancel();
  };

  useEffect(() => {
    let interval;

    if (lectureStarted && !isPaused) {
      interval = setInterval(() => {
        if (mode === "audio") {
          setAudioTimer((prev) => {
            updateAudioTime(prev + 1000);
            return prev + 1000;
          });
        } else {
          setTextTimer((prev) => {
            updateTextTime();
            return prev + 1000;
          });
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [lectureStarted, isPaused, mode]);

  const renderTimeDisplay = () => (
    <div className="time-display">
      <h4>Total Audio Time: {Math.floor(audioTimer / 1000)}s</h4>
      {audioTimes.map((time, index) => (
        <p key={index}>Audio {index + 1} Time: {Math.floor(time / 1000)}s</p>
      ))}
      <h4>Total Text Time: {Math.floor(textTimer / 1000)}s</h4>
      {textTimes.map((time, index) => (
        <p key={index}>Text {index + 1} Time: {Math.floor(time / 1000)}s</p>
      ))}
    </div>
  );

  return (
    <div className="mx-auto py-4 px-8">
      <h2 className="text-2xl font-semibold">Lecture</h2>
      {renderTimeDisplay()} {/* Display the times */}
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
                    {isPaused || !speechSynthesisRef.current.speaking
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
