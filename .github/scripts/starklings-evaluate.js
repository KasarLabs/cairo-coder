const fs = require('fs');
const { execSync } = require('child_process');

function parseInfoToml(infoPath) {
    const content = fs.readFileSync(infoPath, 'utf8');
    const exercises = [];
    const lines = content.split('\n');
    let currentExercise = null;
    let collectingHint = false;
    let hintLines = [];

    for (const line of lines) {
        const cleanLine = line.trim();
        
        if (cleanLine.startsWith('[[exercises]]')) {
            if (currentExercise) {
                if (hintLines.length > 0) {
                    currentExercise.hint = hintLines.join('\n').replace(/^"""/, '').replace(/"""$/, '');
                }
                exercises.push(currentExercise);
            }
            currentExercise = {};
            collectingHint = false;
            hintLines = [];
        } else if (cleanLine.startsWith('hint = """')) {
            collectingHint = true;
            hintLines.push(cleanLine.replace('hint = """', '').trim());
        } else if (collectingHint) {
            if (cleanLine.endsWith('"""')) {
                hintLines.push(cleanLine.replace('"""', '').trim());
                collectingHint = false;
            } else {
                hintLines.push(cleanLine);
            }
        } else if (cleanLine.startsWith('name = ')) {
            currentExercise.name = cleanLine.match(/name = "(.+)"/)[1];
        } else if (cleanLine.startsWith('path = ')) {
            currentExercise.path = cleanLine.match(/path = "(.+)"/)[1];
        } else if (cleanLine.startsWith('mode = ')) {
            currentExercise.mode = cleanLine.match(/mode = "(.+)"/)[1];
        }
    }
    
    // N'oublie pas le dernier exercice
    if (currentExercise) {
        if (hintLines.length > 0) {
            currentExercise.hint = hintLines.join('\n').replace(/"""$/, '');
        }
        exercises.push(currentExercise);
    }
    
    return exercises;
}

function getExerciseObjective(exerciseName) {
    const objectives = {
        'intro1': 'Introduction to Cairo syntax and basic program structure',
        'intro2': 'Understanding Cairo compilation and execution',
        'variables1': 'Learn to declare variables with the `let` keyword',
        'variables2': 'Understand type annotations and basic felt252 type',
        'variables3': 'Learn to initialize variables with values',
        'variables4': 'Understand mutability with the `mut` keyword',
        'variables5': 'Learn about variable shadowing',
        'variables6': 'Understand constants with the `const` keyword',
        // ... continuer pour tous les exercices
    };
    return objectives[exerciseName] || 'Practice Cairo programming concepts';
}

async function callCairoCoderAPI(exerciseContent, exercise) {
    const prompt = `You are solving a Cairo programming exercise.

Exercise: ${exercise.name}
Objective: ${getExerciseObjective(exercise.name)}
${exercise.hint ? `Hint: ${exercise.hint}` : ''}

Instructions:
1. Read and understand the exercise requirements
2. Fix any compilation errors
3. Remove the "// I AM NOT DONE" comment when complete
4. Ensure the solution demonstrates the intended concept

Code to fix:
${exerciseContent}`;

    const response = await fetch('http://localhost:3001/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'cairo-coder',
            messages: [{ role: 'user', content: prompt }]
        })
    });

    return response.json();
}

async function main() {
    const exercises = parseInfoToml('./starklings/info.toml');
    let passed = 0;
    let total = exercises.length;
    
    for (const exercise of exercises) {
        console.log(`Testing ${exercise.name}...`);
        const exerciseContent = fs.readFileSync(`./starklings/${exercise.path}`, 'utf8');
        const response = await callCairoCoderAPI(exerciseContent, exercise);
        
        fs.writeFileSync(`./starklings/${exercise.path}`, response);

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