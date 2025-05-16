'use client';

import { LampDesk } from "lucide-react";
import MainLogo from "../_assets/logo-text.png";
import Image from "next/image";
import { useState, useEffect } from "react";
import axios from "axios";

export default function ConfirmPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [status, setStatus] = useState('Ready');
  const [arduinoStatus, setArduinoStatus] = useState<'connected' | 'disconnected' | 'error' | 'unknown'>('unknown');

  // Function to check Arduino connection status
  const checkArduinoStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/led-control/status');
      setArduinoStatus(response.data.connected ? 'connected' : 'disconnected');
      console.log('Arduino status:', response.data);
    } catch (error) {
      console.error('Error checking Arduino status:', error);
      setArduinoStatus('error');
    }
  };

  // Function to generate a random command and send to Arduino
  const generateRandomCommand = async () => {
    setIsGenerating(true);
    setStatus('Generating...');
    
    try {
      const response = await axios.post('http://localhost:8000/api/led-control/generate');
      
      if (response.data.status === 'success' || response.data.status === 'warning') {
        setCurrentCommand(response.data.command);
        const updatedHistory = [response.data.command, ...commandHistory].slice(0, 5);
        setCommandHistory(updatedHistory);
        
        // Update status based on connection status
        if (response.data.connection_status === 'connected') {
          setStatus('Sent to lamp');
          setArduinoStatus('connected');
        } else if (response.data.connection_status === 'disconnected') {
          setStatus('Arduino not connected (simulation mode)');
          setArduinoStatus('disconnected');
        } else {
          setStatus('Connection error: ' + response.data.arduino_response);
          setArduinoStatus('error');
        }
        
        // Log the randomized results
        console.log('Generated command:', response.data.command);
        console.log('Full response:', response.data);
        console.log('Updated command history:', updatedHistory);
      } else {
        setStatus('Error: ' + response.data.message);
        console.log('Error response:', response.data);
      }
    } catch (error) {
      console.error('Error generating command:', error);
      setStatus('Connection error');
      setArduinoStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to send a specific command to Arduino
  const sendCommand = async (command: string) => {
    setIsGenerating(true);
    setStatus(`Sending command: ${command}...`);
    
    try {
      const response = await axios.post('http://localhost:8000/api/led-control/send', { command });
      
      if (response.data.status === 'success' || response.data.status === 'warning') {
        // Update status based on connection status
        if (response.data.connection_status === 'connected') {
          setStatus('Command sent to lamp');
          setArduinoStatus('connected');
        } else if (response.data.connection_status === 'disconnected') {
          setStatus('Arduino not connected (simulation mode)');
          setArduinoStatus('disconnected');
        } else {
          setStatus('Connection error: ' + response.data.arduino_response);
          setArduinoStatus('error');
        }
        
        console.log('Sent command:', command);
        console.log('Full response:', response.data);
      } else {
        setStatus('Error: ' + response.data.message);
        console.log('Error response:', response.data);
      }
    } catch (error) {
      console.error('Error sending command:', error);
      setStatus('Connection error');
      setArduinoStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate a command when the page loads and check Arduino status
  useEffect(() => {
    checkArduinoStatus();
    generateRandomCommand();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="flex flex-col items-center bg-white/80 rounded-3xl shadow-xl px-10 py-12">
        <div className="relative">
          <LampDesk 
            size={75} 
            className={`mb-4 text-[#47534d] ${isGenerating ? 'animate-pulse' : 'animate-bounce'}`} 
          />
          <div className={`absolute -top-2 -right-2 h-4 w-4 rounded-full ${
            arduinoStatus === 'connected' ? 'bg-green-500 animate-ping' : 
            arduinoStatus === 'disconnected' ? 'bg-yellow-500' : 
            arduinoStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
          }`}></div>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold text-[#747b6e] mb-4 text-center flex flex-wrap items-center justify-center gap-2">
          We hope your personalised picks{" "}
          <span className="inline-block align-middle">
            <Image
              src={MainLogo}
              alt="SUITS Logo"
              height={50}
              style={{ display: "inline", verticalAlign: "middle" }}
            />
          </span>{" "}
          you well.
        </h1>
        
        <p className="text-lg md:text-2xl text-gray-600 mb-4 text-center max-w-xl">
          Let the{" "}
          <span className="font-bold text-[#203429]">navigation lamp</span>{" "}
          guide you to your style.
        </p>
        
        <div className="bg-gray-100 p-4 rounded-lg mb-6 w-full max-w-lg">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm text-gray-500">Current lamp guide:</p>
            <p className={`text-xs px-2 py-1 rounded-full ${
              arduinoStatus === 'connected' ? 'bg-green-100 text-green-800' : 
              arduinoStatus === 'disconnected' ? 'bg-yellow-100 text-yellow-800' : 
              arduinoStatus === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {arduinoStatus === 'connected' ? 'Arduino Connected' : 
               arduinoStatus === 'disconnected' ? 'Arduino Disconnected' : 
               arduinoStatus === 'error' ? 'Connection Error' : 'Checking...'}
            </p>
          </div>
          <p className="font-mono text-sm bg-gray-200 p-2 rounded overflow-x-auto">
            {currentCommand || 'Initializing...'}
          </p>
          <p className="text-xs text-gray-400 mt-2 text-right">{status}</p>
        </div>
        
        <div className="flex gap-4">
          <a
            href="/"
            className="inline-block px-8 py-3 bg-[#E1DBCB] text-[#203429] font-bold rounded-full shadow hover:bg-[#9c988b] transition-colors text-lg"
          >
            Back to Recommendations
          </a>
        </div>
      </div>
    </div>
  );
}