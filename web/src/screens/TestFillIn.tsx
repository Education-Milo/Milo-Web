import React, { useState, useEffect } from 'react';
// import { chatService } from '../store/chatService';

interface FillInQuestion {
  sentence: string;
  options: string[];
  correct_answer: string;
}

const TestFillIn: React.FC = () => {
  const [fillIn, setFillIn] = useState<FillInQuestion[] | null>(null);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [score, setScore] = useState<number>(-1);

  const fetchFillIn = async () => {
    setError('');
    try {
      console.log('Fetching FillIn for subject:', subject);
      // const response = await chatService.createFillIn(subject);
      // setFillIn(response.fill_in);
      // setScore(-1); // reset score when fetching new FillIn
      // setUserAnswers({}); // reset les réponses à chaque fetch
    } catch (err) {
      console.error('Error fetching FillIn:', err);
      setError('Failed to fetch FillIn. Please try again later.');
    }
  };

  const handleAnswer = (questionIndex: number, selectedOption: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: selectedOption }));
  };

  const calculateScore = () => {
    if (!fillIn) return 0;
    const score = fillIn.reduce((score, item, index) => {
        return score + (userAnswers[index] === item.correct_answer ? 1 : 0);
        }, 0);
    setScore(score);
  };

  return (
    <div>
      <h1>Test FillIn</h1>
      <input
        type="text"
        placeholder="Entrez le sujet du Fill In"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <button onClick={fetchFillIn}>Générer Fill In</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {fillIn && (
        <div>
          <h2>Fill In Questions</h2>
          {fillIn.map((item, index) => (
            <div key={index} style={{ marginBottom: '20px' }}>
              <p><strong>{index + 1}. {item.sentence}</strong></p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginLeft: '20px' }}>
                {item.options.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    onClick={() => handleAnswer(index, option)}
                    style={{
                      padding: '10px 15px',
                      border: '2px solid #ccc',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: userAnswers[index] === option ? '#007bff' : '#f8f9fa',
                      color: userAnswers[index] === option ? 'white' : 'black',
                      transition: 'all 0.2s ease',
                      minWidth: '120px',
                      textAlign: 'center',
                    }}
                    onMouseOver={(e) => {
                      if (userAnswers[index] !== option) {
                        e.currentTarget.style.backgroundColor = '#e9ecef';
                        e.currentTarget.style.borderColor = '#007bff';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (userAnswers[index] !== option) {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#ccc';
                      }
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={calculateScore}>
            Submit Answers
          </button>
          {score >= 0 && (
            <h3>Score: {score} / {fillIn.length}</h3>
          )}
        </div>
      )}
    </div>
  );
};

export default TestFillIn;