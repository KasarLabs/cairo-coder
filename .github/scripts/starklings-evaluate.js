const fs = require('fs');
const { execSync } = require('child_process');

function parseInfoToml(infoPath) {
    const fs = require('fs');
    const content = fs.readFileSync(infoPath, 'utf8');
    
    const exercises = [];
    const lines = content.split('\n');
    
    let currentExercise = null;
    
    for (const line of lines) {
      const cleanLine = line.trim();
      
      if (cleanLine.startsWith('[[exercises]]')) {
        if (currentExercise) exercises.push(currentExercise);
        currentExercise = {};
      } else if (cleanLine.startsWith('name = ')) {
        currentExercise.name = cleanLine.match(/name = "(.+)"/)[1];
      } else if (cleanLine.startsWith('path = ')) {
        currentExercise.path = cleanLine.match(/path = "(.+)"/)[1];
      } else if (cleanLine.startsWith('mode = ')) {
        currentExercise.mode = cleanLine.match(/mode = "(.+)"/)[1];
      }
    }
    
    if (currentExercice) exercises.push(currentExercise);
    return exercises;
}

async function callCairoCoderAPI(exerciseContent) {
    const response = await fetch('http://localhost:3001/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'cairo-coder',
        messages: [
          {
            role: 'user',
            content: `Complete this Cairo exercise by fixing the code. Remove the "// I AM NOT DONE" comment and fix any compilation errors:\n\n${exerciseContent}`
          }
        ]
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  }

async function main() {
  // 1. Parser info.toml pour lister tous les exercices
  const exercises = parseInfoToml('./starklings/info.toml');
  
  let passed = 0;
  let total = exercises.length;
  
  for (const exercise of exercises) {
    console.log(`Testing ${exercise.name}...`);
    const exerciseContent = fs.readFileSync(`./starklings/${exercise.path}`, 'utf8');
    const response = await callCairoCoderAPI(exerciseContent);
    fs.writeFileSync(`./starklings/${exercise.path}`, response);
    
    // Tester avec starklings
    try {
      execSync(`cd starklings && cargo run -r --bin starklings run ${exercise.name}`, { stdio: 'pipe' });
      console.log(`✅ ${exercise.name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${exercise.name}`);
    }
  }
  
  console.log(`\nResults: ${passed}/${total} exercises passed (${(passed/total*100).toFixed(1)}%)`);
  
  // Fail CI si moins de 80% de réussite
  if (passed/total < 0.8) {
    process.exit(1);
  }
}

main().catch(console.error);