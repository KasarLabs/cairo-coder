const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Configuration de débogage
const DEBUG = true;
const SINGLE_EXERCISE = process.env.SINGLE_EXERCISE || null; // ex: "intro1"
const SAVE_RESPONSES = true;

function log(message) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`);
    }
}

function parseInfoToml(infoPath) {
    log(`Parsing info.toml from: ${infoPath}`);
    
    if (!fs.existsSync(infoPath)) {
        throw new Error(`info.toml not found at: ${infoPath}`);
    }
    
    const content = fs.readFileSync(infoPath, 'utf8');
    log(`File content length: ${content.length} characters`);
    
    const exercises = [];
    const lines = content.split('\n');
    let currentExercise = null;
    let collectingHint = false;
    let hintLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cleanLine = line.trim();
        
        if (cleanLine.startsWith('[[exercises]]')) {
            if (currentExercise) {
                if (hintLines.length > 0) {
                    currentExercise.hint = hintLines.join('\n').replace(/^"""/, '').replace(/"""$/, '');
                }
                exercises.push(currentExercise);
                log(`Added exercise: ${currentExercise.name}`);
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
            const match = cleanLine.match(/name = "(.+)"/);
            if (match) {
                currentExercise.name = match[1];
            }
        } else if (cleanLine.startsWith('path = ')) {
            const match = cleanLine.match(/path = "(.+)"/);
            if (match) {
                currentExercise.path = match[1];
            }
        } else if (cleanLine.startsWith('mode = ')) {
            const match = cleanLine.match(/mode = "(.+)"/);
            if (match) {
                currentExercise.mode = match[1];
            }
        }
    }
    
    // N'oublie pas le dernier exercice
    if (currentExercise) {
        if (hintLines.length > 0) {
            currentExercise.hint = hintLines.join('\n').replace(/"""$/, '');
        }
        exercises.push(currentExercise);
        log(`Added final exercise: ${currentExercise.name}`);
    }
    
    log(`Total exercises parsed: ${exercises.length}`);
    return exercises;
}

async function testServerConnection() {
    log('Testing server connection...');
    
    try {
        const response = await fetch('http://localhost:3001/', {
            method: 'GET',
            timeout: 5000
        });
        
        if (response.ok) {
            log('✅ Server connection successful');
            return true;
        } else {
            log(`❌ Server responded with status: ${response.status}`);
            return false;
        }
    } catch (error) {
        log(`❌ Server connection failed: ${error.message}`);
        return false;
    }
}

async function callCairoCoderAPI(exerciseContent, exercise) {
    log(`Calling API for exercise: ${exercise.name}`);
    
    const prompt = `You are solving a Cairo programming exercise.

Exercise: ${exercise.name}
${exercise.hint ? `Hint: ${exercise.hint}` : ''}

Instructions:
1. Read and understand the exercise requirements
2. Fix any compilation errors
3. Remove the "// I AM NOT DONE" comment when complete
4. Ensure the solution demonstrates the intended concept

Code to fix:
${exerciseContent}

Please provide only the corrected code, without any additional explanation or markdown formatting.`;

    const requestBody = {
        model: 'cairo-coder',
        messages: [{ role: 'user', content: prompt }],
        stream: false
    };

    log(`Request body size: ${JSON.stringify(requestBody).length} characters`);

    try {
        const response = await fetch('http://localhost:3001/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Starklings-Evaluator/1.0'
            },
            body: JSON.stringify(requestBody),
            timeout: 60000 // 60 secondes
        });

        if (!response.ok) {
            const errorText = await response.text();
            log(`API Error - Status: ${response.status}, Response: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        log(`API Response received, data structure: ${Object.keys(data).join(', ')}`);
        
        // Sauvegarder la réponse complète si demandé
        if (SAVE_RESPONSES) {
            const responseFile = path.join(__dirname, '..', '..', 'debug', `${exercise.name}_response.json`);
            fs.mkdirSync(path.dirname(responseFile), { recursive: true });
            fs.writeFileSync(responseFile, JSON.stringify(data, null, 2));
            log(`Response saved to: ${responseFile}`);
        }
        
        // Extraire le contenu de la réponse
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const content = data.choices[0].message.content;
            log(`Generated code length: ${content.length} characters`);
            return content;
        } else {
            log(`Invalid response format: ${JSON.stringify(data)}`);
            throw new Error('Invalid response format from API');
        }
    } catch (error) {
        log(`API call failed: ${error.message}`);
        throw error;
    }
}

async function testExercise(exercise, starklingsPath) {
    log(`\n=== Testing exercise: ${exercise.name} ===`);
    
    const exercisePath = path.join(starklingsPath, exercise.path);
    log(`Exercise path: ${exercisePath}`);
    
    if (!fs.existsSync(exercisePath)) {
        log(`❌ Exercise file not found: ${exercisePath}`);
        return false;
    }
    
    // Lire le contenu original
    const originalContent = fs.readFileSync(exercisePath, 'utf8');
    log(`Original file size: ${originalContent.length} characters`);
    
    // Sauvegarder l'original
    const backupPath = exercisePath + '.backup';
    fs.writeFileSync(backupPath, originalContent);
    log(`Backup saved to: ${backupPath}`);
    
    try {
        // Appeler l'API
        const correctedCode = await callCairoCoderAPI(originalContent, exercise);
        
        // Sauvegarder la solution
        fs.writeFileSync(exercisePath, correctedCode);
        log(`Updated exercise file with generated code`);
        
        // Sauvegarder la solution générée pour debug
        if (SAVE_RESPONSES) {
            const solutionFile = path.join(__dirname, '..', '..', 'debug', `${exercise.name}_solution.cairo`);
            fs.mkdirSync(path.dirname(solutionFile), { recursive: true });
            fs.writeFileSync(solutionFile, correctedCode);
            log(`Solution saved to: ${solutionFile}`);
        }
        
        // Tester la solution
        try {
            log(`Running starklings for ${exercise.name}...`);
            const result = execSync(`cargo run --bin starklings run ${exercise.name}`, {
                cwd: starklingsPath,
                stdio: 'pipe',
                timeout: 30000,
                encoding: 'utf8'
            });
            
            log(`✅ ${exercise.name} - Success`);
            log(`Starklings output: ${result.substring(0, 200)}...`);
            return true;
        } catch (error) {
            log(`❌ ${exercise.name} - Execution failed`);
            log(`Error code: ${error.status}`);
            log(`stdout: ${error.stdout ? error.stdout.substring(0, 500) : 'none'}`);
            log(`stderr: ${error.stderr ? error.stderr.substring(0, 500) : 'none'}`);
            
            // Sauvegarder l'erreur pour debug
            if (SAVE_RESPONSES) {
                const errorFile = path.join(__dirname, '..', '..', 'debug', `${exercise.name}_error.txt`);
                fs.writeFileSync(errorFile, `Exit code: ${error.status}\n\nSTDOUT:\n${error.stdout}\n\nSTDERR:\n${error.stderr}`);
                log(`Error details saved to: ${errorFile}`);
            }
            
            return false;
        }
    } catch (error) {
        log(`❌ ${exercise.name} - API call failed: ${error.message}`);
        return false;
    } finally {
        // Restaurer l'original
        fs.writeFileSync(exercisePath, originalContent);
        fs.unlinkSync(backupPath);
        log(`Restored original file and cleaned up backup`);
    }
}

async function main() {
    log('=== Starting Starklings Debug Session ===');
    
    const starklingsPath = path.join(process.cwd(), 'starklings');
    const infoPath = path.join(starklingsPath, 'info.toml');
    
    // Vérifications initiales
    log(`Working directory: ${process.cwd()}`);
    log(`Starklings path: ${starklingsPath}`);
    log(`Info.toml path: ${infoPath}`);
    
    if (!fs.existsSync(starklingsPath)) {
        console.error('❌ Starklings directory not found');
        process.exit(1);
    }
    
    if (!fs.existsSync(infoPath)) {
        console.error('❌ info.toml not found in starklings directory');
        process.exit(1);
    }
    
    // Tester la connexion au serveur
    const serverOk = await testServerConnection();
    if (!serverOk) {
        console.error('❌ Server is not accessible');
        process.exit(1);
    }
    
    // Parser les exercices
    const exercises = parseInfoToml(infoPath);
    
    if (exercises.length === 0) {
        console.error('❌ No exercises found');
        process.exit(1);
    }
    
    // Filtrer à un seul exercice si demandé
    let exercisesToTest = exercises;
    if (SINGLE_EXERCISE) {
        exercisesToTest = exercises.filter(ex => ex.name === SINGLE_EXERCISE);
        if (exercisesToTest.length === 0) {
            console.error(`❌ Exercise '${SINGLE_EXERCISE}' not found`);
            console.log('Available exercises:', exercises.map(ex => ex.name).join(', '));
            process.exit(1);
        }
        log(`Testing single exercise: ${SINGLE_EXERCISE}`);
    }
    
    // Créer le dossier de debug
    const debugDir = path.join(__dirname, '..', '..', 'debug');
    fs.mkdirSync(debugDir, { recursive: true });
    
    // Tester les exercices
    let passed = 0;
    let total = exercisesToTest.length;
    
    console.log(`\n🧪 Starting evaluation of ${total} exercises...`);
    
    for (const exercise of exercisesToTest) {
        const success = await testExercise(exercise, starklingsPath);
        if (success) {
            passed++;
        }
        
        // Pause entre les exercices pour éviter la surcharge
        if (exercisesToTest.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log(`\n=== Final Results ===`);
    console.log(`${passed}/${total} exercises passed (${(passed/total*100).toFixed(1)}%)`);
    
    log(`Debug files saved in: ${debugDir}`);
    log('=== Debug Session Complete ===');
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});