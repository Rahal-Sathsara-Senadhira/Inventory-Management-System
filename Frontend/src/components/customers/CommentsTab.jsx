import React from 'react'


import { useState, useEffect } from "react";
const CommentsTab=()=> {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");

  // Load dummy initial comments
  useEffect(() => {
    const dummyComments = [
      {
        user: "Moises",
        message: "dfhdghn",
        timestamp: "2024-09-21T02:08:00",
        invoiceLink: "#",
      },
      {
        user: "Fabian",
        message: "fvsfvbsfbfdv",
        timestamp: "2024-09-21T02:08:00",
        invoiceLink: "#",
      },
      {
        user: "Pinkie",
        message: "",
        timestamp: "2024-09-21T02:08:00",
      },
    ];
    setComments(dummyComments);
  }, []);

  // Handle comment add
  const handleAddComment = () => {
    if (!input.trim()) return;
    const newComment = {
      user: "You", // Change this to actual user in real usage
      message: input,
      timestamp: new Date().toISOString(),
    };
    setComments([...comments, newComment]);
    setInput("");
  };

  return (
    <div className="p-4 border rounded bg-gray-50 shadow-sm">
      {/* Input Section */}
      <div className="mb-4">
        <textarea
          className="w-full p-2 border rounded resize-none focus:outline-none focus:ring focus:ring-blue-300"
          rows="3"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add your comment..."
        />
        <button
          onClick={handleAddComment}
          className="mt-2 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Add Comment
        </button>
      </div>

      {/* Comment List */}
      <div>
        <h3 className="font-semibold text-sm text-gray-700 mb-2">
          ALL COMMENTS{" "}
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs ml-2">
            {comments.length}
          </span>
        </h3>
        {comments.map((c, i) => (
          <div key={i} className="bg-white border p-3 rounded mb-2 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <span>{c.user}</span>
              <span className="text-gray-400 text-xs">
                • {new Date(c.timestamp).toLocaleString()}
              </span>
            </div>
            {c.message && <div className="mt-1 text-sm">{c.message}</div>}
            {c.invoiceLink && (
              <div className="mt-1">
                <a
                  href={c.invoiceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline"
                >
                  👁️ View the retainer invoice
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommentsTab