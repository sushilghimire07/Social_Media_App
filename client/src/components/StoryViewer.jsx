import { BadgeCheck, X } from "lucide-react";
import React, { useEffect, useState } from "react";

const StoryViewer = ({ viewStory, setViewStory }) => {

  const handleClose = ()=> setViewStory(null);
  const [progress , setProgress] =useState(0)

  useEffect(()=>{

    let timer,progressInterval;
    if(viewStory && viewStory.media_type !== 'video'){
      setProgress(0)

      const duration  = 10000; // 10 seconds
      const setTime = 100;
      let elapsed = 0;

      progressInterval = setInterval(() => {
        elapsed += setTime;
        const percentage = Math.min((elapsed/duration)*100,100)
        setProgress(percentage);
      }, setTime);

      timer = setTimeout(()=>{
        setViewStory(null)
      },duration)
    }

    return ()=>{
      clearTimeout(timer);
      clearInterval(progressInterval)
    }

  },[viewStory,setViewStory])

  if(!viewStory) return null

  const renderContent = () =>{
    switch (viewStory.media_type) {
      case 'image':
        return (
          <img
            src={viewStory.media_url}
            className="max-w-full max-h-screen object-contain rounded-xl shadow-2xl"
          />
        );
      case 'video':
        return (
          <video
            onEnded={()=>setViewStory(null)}
            src={viewStory.media_url}
            className="max-w-full max-h-screen rounded-xl shadow-2xl"
            controls autoPlay
          />
        );
      case 'text':
        return (
          <div className="w-full h-full flex items-center justify-center p-6 text-white text-2xl sm:text-4xl text-center font-semibold leading-relaxed">
            {viewStory.content}
          </div>
        );
      default:
       return null;
    }
  }

  return (
    <div
      className="fixed inset-0 h-screen bg-black bg-opacity-90 z-[110] flex items-center justify-center transition-all duration-200"
      style={{
        backgroundColor:
          viewStory.media_type === "text"
            ? viewStory.background_color
            : "#000000",
      }}
    >
      {/* progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-50 linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* user info */}
      <div className="absolute top-4 left-4 flex items-center gap-3 py-2 px-4 sm:py-3 sm:px-6 rounded-full backdrop-blur-xl bg-black/30 border border-white/20">
        <img
          src={viewStory.user?.profile_picture}
          alt=""
          className="size-8 sm:size-9 rounded-full object-cover border border-white"
        />
        <div className="text-white font-medium flex items-center gap-1">
          <span>{viewStory.user?.full_name}</span>
          <BadgeCheck size={18} />
        </div>
      </div>

      {/* close */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white focus:outline-none"
      >
        <X className="w-9 h-9 hover:scale-125 hover:text-white/90 transition-transform duration-150 cursor-pointer" />
      </button>

      {/* content */}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
       {renderContent()}
      </div>

    </div>
  );
};

export default StoryViewer;
