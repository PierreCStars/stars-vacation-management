'use client';

import { useState } from 'react';
import GuideModal from './GuideModal';

export default function UserGuideCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div 
        className="card text-center hover:shadow-xl transition-shadow duration-300"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: '1rem', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
          padding: '2.5rem',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'box-shadow 0.3s ease'
        }}
      >
        <div className="mb-6">
          <div 
            className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ 
              width: '4rem', 
              height: '4rem', 
              backgroundColor: '#f3e8ff', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1rem auto' 
            }}
          >
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 
            className="text-2xl font-semibold mb-4 text-gray-900"
            style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '1rem' 
            }}
          >
            User Guide
          </h3>
          <p 
            className="text-gray-600 mb-6"
            style={{ 
              color: '#4b5563', 
              marginBottom: '1.5rem',
              lineHeight: 1.6
            }}
          >
            View the interactive guide for detailed instructions
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200"
          style={{ 
            display: 'inline-block',
            backgroundColor: '#9333ea',
            color: 'white',
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'background-color 0.2s ease',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          📖 View Guide
        </button>
      </div>
      
      <GuideModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
} 