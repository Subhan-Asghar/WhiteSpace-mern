import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000'); // Ensure this matches your backend URL

const Board = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000'); // Default color is black
  const [brushSize, setBrushSize] = useState(2); // Default brush size

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw using data from other users
    socket.on('draw', ({ x0, y0, x1, y1, color, brushSize }) => {
      drawLine(x0, y0, x1, y1, context, color, brushSize);
    });
  }, []);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);
    socket.emit('draw', { x0: offsetX, y0: offsetY, x1: offsetX, y1: offsetY, color, brushSize });
  };

  const finishDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const prevX = e.nativeEvent.movementX + offsetX;
    const prevY = e.nativeEvent.movementY + offsetY;

    // Emit draw event to the server
    socket.emit('draw', {
      x0: prevX - rect.left,
      y0: prevY - rect.top,
      x1: offsetX - rect.left,
      y1: offsetY - rect.top,
      color,
      brushSize,
    });

    // Draw locally
    drawLine(prevX - rect.left, prevY - rect.top, offsetX - rect.left, offsetY - rect.top, context, color, brushSize);
  };

  const drawLine = (x0, y0, x1, y1, context, strokeColor, lineWidth) => {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = strokeColor;
    context.lineWidth = lineWidth;
    context.lineJoin = 'round';
    context.lineCap = 'round'; 
    context.stroke();
    context.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'whiteboard-drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <>
      <nav className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="text-white text-lg font-bold">White Space</div>
        <div className="flex items-center space-x-4">
          <label className="text-white">Brush Color:</label>
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)} 
            className="border-none w-10 cursor-pointer"
          />
          <label className="text-white">Brush Size:</label>
          <input
            type="range"
            min="1"
            max="10"
            value={brushSize}
            onChange={(e) => setBrushSize(e.target.value)}
            className="w-24"
          />
          <button 
            onClick={clearCanvas} 
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Clear
          </button>
          <button 
            onClick={saveCanvas} 
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Save
          </button>
        </div>
      </nav>

      <div className="m-4">
        <canvas
          ref={canvasRef}
          className="border-2 border-gray-500 w-full h-96 bg-gray-200"
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
        />
      </div>
    </>
  );
};

export default Board;
