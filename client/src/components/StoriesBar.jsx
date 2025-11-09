import React, { useEffect, useState } from 'react';
import { dummyStoriesData } from '../assets/assets';
import { Plus } from 'lucide-react';
import moment from 'moment';
import StoryModel from './StoryModel';
import StoryViewer from './StoryViewer';

const StoriesBar = () => {
  const [stories, setStories] = useState([]);
  const [showModel, setShowModel] = useState(false);
  const [viewStory, setViewStory] = useState(null);

  const fetchStories = async () => {
    setStories(dummyStoriesData);
  };

  useEffect(() => {
    fetchStories();
  }, []);

  return (
    <>
      <div className='w-screen sm:w-[calc(100vw-240px)] lg:max-w-2xl overflow-x-auto px-4 no-scrollbar'>
        <div className='flex gap-4 pb-5'>
          {/* Add Story Card */}
          <div
            onClick={() => setShowModel(true)}
            className='rounded-lg shadow-sm min-w-[7.5rem] max-w-[7.5rem] max-h-[10rem] aspect-[3/4] cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-indigo-300 bg-gradient-to-b'
          >
            <div className='h-full flex flex-col items-center justify-center p-4'>
              <div className='w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mb-3'>
                <Plus className='w-5 h-5 text-white' />
              </div>
              <p className='text-sm font-medium text-slate-700 text-center'>Create Story</p>
            </div>
          </div>

          {/* Story cards */}
          {stories.map((story, index) => (
            <div
             
              key={index}
              onClick={() => { setViewStory(story); }}
              className='relative rounded-lg shadow min-w-[7.5rem] max-w-[7.5rem] max-h-[10rem] cursor-pointer hover:shadow-lg transition-all duration-200 flex items-end overflow-hidden'
              style={{
                backgroundColor: story.media_type === 'text' ? story.background_color : 'transparent',
                backgroundImage: story.media_type === 'image' ? `url(${story.media_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* User profile */}
              <img
                src={story.user.profile_picture}
                alt={story.user.full_name}
                className='absolute w-10 h-10 top-3 left-3 z-10 rounded-full ring ring-gray-100 shadow'
              />

              {/* Story content for text stories */}
              {story.media_type === 'text' && story.content && (
                <p className='absolute top-16 left-3 text-white text-sm truncate max-w-[6rem]'>
                  {story.content}
                </p>
              )}

              {/* Story content for image/video stories */}
              {story.media_type !== 'text' && story.content && (
                <p className='absolute bottom-5 left-3 text-white text-sm truncate max-w-[6rem] bg-black/50 px-1 rounded'>
                  {story.content}
                </p>
              )}

              {/* Video overlay */}
              {story.media_type === 'video' && story.media_url && (
                <video
                  src={story.media_url}
                  className='w-full h-full object-cover'
                  autoPlay
                  muted
                  loop
                />
              )}

              {/* Timestamp */}
              <p className='absolute bottom-1 right-2 z-10 text-xs text-white'>
                {moment(story.createdAt).fromNow()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Story model */}
      {showModel && (
        <StoryModel setShowModel={setShowModel} fetchStories={fetchStories} />
        
      )}
      {/* viewstory model */}
      {
        viewStory && <StoryViewer viewStory={viewStory} setViewStory={setViewStory}/>
      }
    </>
  );
};

export default StoriesBar;
