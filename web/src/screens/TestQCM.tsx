import React, { useState, useEffect } from 'react';
// import { chatService } from '../store/chatService';

interface QCMQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

const TestQCM: React.FC = () => {
  const [qcm, setQCM] = useState<QCMQuestion[] | null>(null);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [score, setScore] = useState<number>(-1);

  const fetchQCM = async () => {
    setError('');
    try {
      console.log('Fetching QCM for subject:', subject);
      // const response = await chatService.createQCM(subject);
      // setQCM(response.qcm);
      // setScore(-1); // reset score when fetching new QCM
      // setUserAnswers({}); // reset les réponses à chaque fetch
    } catch (err) {
      console.error('Error fetching QCM:', err);
      setError('Failed to fetch QCM. Please try again later.');
    }
  };

  const handleAnswer = (questionIndex: number, selectedOption: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: selectedOption }));
  };

  const calculateScore = () => {
    if (!qcm) return 0;
    const score = qcm.reduce((score, item, index) => {
        return score + (userAnswers[index] === item.correct_answer ? 1 : 0);
        }, 0);
    setScore(score);
    };

  return (
    <div>
      <h1>Test QCM</h1>
      <input
        type="text"
        placeholder="Entrez le sujet du QCM"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <button onClick={fetchQCM}>Générer QCM</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {qcm && (
        <div>
          <h2>QCM Questions</h2>
          {qcm.map((item, index) => (
            <div key={index} style={{ marginBottom: '20px' }}>
              <p><strong>{index + 1}. {item.question}</strong></p>
              {item.options.map((option, optIndex) => (
                <label key={optIndex} style={{ display: 'block', marginLeft: '20px' }}>
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={option}
                    checked={userAnswers[index] === option}
                    onChange={() => handleAnswer(index, option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          ))}
          <button onClick={calculateScore}>
            Submit Answers
            </button>
            {score >= 0 && (
              <h3>Score: {score} / {qcm.length}</h3>
            )}
        </div>
      )}
    </div>
  );
};

export default TestQCM;
