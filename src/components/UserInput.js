import React from 'react';

const UserInput = ({ value, onChange, isStreaming }) => {
  return (
    <div className="user-input" style={{ height: '100%' }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the website you want to create..."
        disabled={isStreaming}
        className="input-textarea"
      />
      {isStreaming && <p style={{ color: 'var(--button-background)', marginTop: '10px', fontSize: '16px' }}>Streaming in progress...</p>}
    </div>
  );
};

export default UserInput;