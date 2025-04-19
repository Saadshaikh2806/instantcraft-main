import React from 'react';

const ModifyWebsiteInput = ({ value, onChange, isStreaming }) => {
  return (
    <div className="modify-website-input">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe how you want to modify the website..."
        disabled={isStreaming}
        className="input-textarea"
      />
      {isStreaming && (
        <p style={{ color: 'var(--button-background)', marginTop: '10px', fontSize: '16px' }}>
          Modifying in progress...
        </p>
      )}
    </div>
  );
};

export default ModifyWebsiteInput;