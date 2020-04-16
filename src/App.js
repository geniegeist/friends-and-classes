import React from 'react';
import Courses from './Courses.js';
import './App.css';

function App() {
  return (
    <div className="App">
      <div style={{textAlign: "center", paddingBottom: "0.5em"}}>
        <h1>Was belegen meine Freunde?</h1>
        <p style={{opacity: 0.6}}>Tragt euch ein, indem ihr auf die Buttons klickt. <br /> Um euch zu auszutragen, einfach das blaue Feld mit eurem Namen tippen, leeren und enter drücken.</p>
      </div>
      <Courses />
    </div>
  );
}

export default App;
