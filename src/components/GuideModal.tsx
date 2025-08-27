'use client';


interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '64rem',
          width: '100%',
          margin: '0 1rem',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <h2 
            className="text-xl font-semibold text-gray-900"
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827'
            }}
          >
            How to Submit a Vacation Request
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            style={{
              color: '#9ca3af',
              transition: 'color 0.2s ease',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>
        <div 
          className="p-4"
          style={{ padding: '1rem' }}
        >
          <iframe 
            src="https://scribehow.com/embed/How_to_Submit_a_Vacation_Request_Online_using_in_house_Stars_App__BVWMMZEkSVSVE4pKtAPHuQ" 
            width="100%" 
            height="600" 
            allow="fullscreen" 
            style={{
              aspectRatio: '1 / 1',
              border: 0,
              minHeight: '480px',
              borderRadius: '0.375rem'
            }}
          />
        </div>
      </div>
    </div>
  );
} 