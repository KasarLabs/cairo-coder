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
    if (!fs.existsSync(infoPath)) {
        throw new Error(`info.toml not found at: ${infoPath}`);
    }
    
    const content = fs.readFileSync(infoPath, 'utf8');
    const lines = content.split('\n');
    
    const categories = {};
    let currentCategory = null;
    let currentExercise = null;
    let collectingHint = false;
    let hintLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cleanLine = line.trim();
        
        // Détecter les catégories
        if (cleanLine.startsWith('# ') && !cleanLine.startsWith('##')) {
            currentCategory = cleanLine.substring(2).trim();
            categories[currentCategory] = [];
            continue;
        }
        
        if (cleanLine.startsWith('[[exercises]]')) {
            if (currentExercise) {
                if (hintLines.length > 0) {
                    currentExercise.hint = hintLines.join('\n').replace(/^"""/, '').replace(/"""$/, '');
                }
                if (currentCategory) {
                    categories[currentCategory].push(currentExercise);
                }
            }
            currentExercise = { category: currentCategory };
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
        if (currentCategory) {
            categories[currentCategory].push(currentExercise);
        }
    }
    
    return categories;
}

async function testServerConnection() {
    log('Testing server connection...');

    try {
        const response = await fetch('http://localhost:3002/', {
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
    // log(`Calling API for exercise: ${exercise.name}`);
    
    const prompt = `You are solving a Cairo programming exercise.

Exercise: ${exercise.name}
${exercise.hint ? `Hint: ${exercise.hint}` : ''}

Instructions:
1. Read and understand the exercise requirements
2. Fix any compilation errors
3. Remove the "// I AM NOT DONE" comment when complete
4. Ensure the solution demonstrates the intended concept
5. The solution must be in the same language as the exercise (Cairo)

Code to fix:
${exerciseContent}

Please provide only the corrected code, without any additional explanation or markdown formatting.`;

    const requestBody = {
        model: 'cairo-coder',
        messages: [{ role: 'user', content: prompt }],
        stream: false
    };

    // log(`Request body size: ${JSON.stringify(requestBody).length} characters`);

    try {
        const response = await fetch('http://localhost:3002/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
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
        // log(`API Response received, data structure: ${Object.keys(data).join(', ')}`);
        
        // Sauvegarder la réponse complète si demandé
        if (SAVE_RESPONSES) {
            const responseFile = path.join(__dirname, '..', '..', 'debug', `${exercise.name}_response.json`);
            fs.mkdirSync(path.dirname(responseFile), { recursive: true });
            fs.writeFileSync(responseFile, JSON.stringify(data, null, 2));
            // log(`Response saved to: ${responseFile}`);
        }
        
        // Extraire le contenu de la réponse
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const rawContent = data.choices[0].message.content;
            const cleanCode = extractCairoCode(rawContent);
            // log(`Generated code length: ${cleanCode.length} characters`);
            // log(`Raw response length: ${rawContent.length} characters`);
            return cleanCode;
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
    // log(`Exercise path: ${exercisePath}`);
    
    if (!fs.existsSync(exercisePath)) {
        log(`❌ Exercise file not found: ${exercisePath}`);
        return false;
    }
    
    // Lire le contenu original
    const originalContent = fs.readFileSync(exercisePath, 'utf8');
    // log(`Original file size: ${originalContent.length} characters`);
    
    // Sauvegarder l'original
    const backupPath = exercisePath + '.backup';
    fs.writeFileSync(backupPath, originalContent);
    // log(`Backup saved to: ${backupPath}`);
    
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
            // log(`Solution saved to: ${solutionFile}`);
        }
        
        // Tester la solution
        try {
            log(`Running starklings for ${exercise.name}...`);
            const result = execSync(`cargo run --bin starklings run ${exercise.name} 2>/dev/null`, {
                cwd: starklingsPath,
                stdio: 'pipe',
                timeout: 300000,
                encoding: 'utf8'
            });
            
            log(`✅ ${exercise.name} - Success`);
            log(`Starklings output: ${result.substring(0, 200)}...`);
            return { success: true };
        } catch (error) {
            log(`❌ ${exercise.name} - Execution failed`);
            log(`Error code: ${error.status}`);
            log(`stdout: ${error.stdout ? error.stdout.substring(0, 500) : 'none'}`);
            log(`stderr: ${error.stderr ? error.stderr.substring(0, 500) : 'none'}`);
            
            // Formater l'erreur pour le rapport
            const errorDetails = {
                exitCode: error.status,
                stdout: error.stdout || '',
                stderr: error.stderr || ''
            };
            
            // Sauvegarder l'erreur pour debug
            if (SAVE_RESPONSES) {
                const errorFile = path.join(__dirname, '..', '..', 'debug', `${exercise.name}_error.txt`);
                fs.writeFileSync(errorFile, `Exit code: ${error.status}\n\nSTDOUT:\n${error.stdout}\n\nSTDERR:\n${error.stderr}`);
                log(`Error details saved to: ${errorFile}`);
            }
            
            return { success: false, error: errorDetails };
        }
    } catch (error) {
        log(`❌ ${exercise.name} - API call failed: ${error.message}`);
        return { success: false, error: { message: error.message, type: 'API_ERROR' } };
    } finally {
        // Restaurer l'original
        fs.writeFileSync(exercisePath, originalContent);
        fs.unlinkSync(backupPath);
        log(`Restored original file and cleaned up backup`);
    }
}

async function processCategoryWorker(categoryName, exercises, starklingsPath) {
    const categoryResults = {
        category: categoryName,
        exercises: [],
        passed: 0,
        total: exercises.length
    };

    log(`\n[${categoryName}] Starting ${exercises.length} exercises...`);

    for (const exercise of exercises) {
        const result = await testExercise(exercise, starklingsPath);
        
        const exerciseResult = {
            name: exercise.name,
            success: result.success
        };

        // Ajouter les erreurs seulement si échec
        if (!result.success && result.error) {
            exerciseResult.error = result.error;
        }

        categoryResults.exercises.push(exerciseResult);
        if (result.success) {
            categoryResults.passed++;
        }

        log(`[${categoryName}] ${exercise.name}: ${result.success ? '✅' : '❌'}`);
    }

    categoryResults.successRate = (categoryResults.passed / categoryResults.total * 100).toFixed(1);

    // Sauvegarder le rapport de catégorie
    const reportPath = path.join(__dirname, '..', '..', 'debug', `${categoryName.toLowerCase().replace(/\s+/g, '_')}_report.json`);
    fs.writeFileSync(reportPath, JSON.stringify(categoryResults, null, 2));

    log(`[${categoryName}] Completed: ${categoryResults.passed}/${categoryResults.total} (${categoryResults.successRate}%)`);
    return categoryResults;
}

function extractCairoCode(generatedResponse) {
    // Chercher les blocs de code Cairo ou génériques
    const codeBlockRegex = /```(?:cairo|rust|)?\s*\n([\s\S]*?)\n```/g;
    const matches = generatedResponse.match(codeBlockRegex);
    
    if (matches && matches.length > 0) {
        // Extraire le contenu du premier bloc de code trouvé
        const codeBlock = matches[0];
        const codeContent = codeBlock.replace(/```(?:cairo|rust|)?\s*\n/, '').replace(/\n```$/, '');
        return codeContent.trim();
    }
    
    // Si pas de bloc de code trouvé, retourner le texte tel quel
    return generatedResponse.trim();
}

async function main() {
    const starklingsPath = path.join(process.cwd(), 'starklings');
    const infoPath = path.join(starklingsPath, 'info.toml');

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
    
    // Parser les exercices par catégorie
    const categories = parseInfoToml(infoPath);
    
    if (Object.keys(categories).length === 0) {
        console.error('❌ No categories found');
        process.exit(1);
    }

    // Filtrer à une seule catégorie si demandé
    let categoriesToTest = categories;
    if (SINGLE_EXERCISE) {
        // Trouver la catégorie contenant l'exercice
        let foundCategory = null;
        for (const [categoryName, exercises] of Object.entries(categories)) {
            if (exercises.some(ex => ex.name === SINGLE_EXERCISE)) {
                foundCategory = categoryName;
                break;
            }
        }
        
        if (!foundCategory) {
            console.error(`❌ Exercise '${SINGLE_EXERCISE}' not found`);
            process.exit(1);
        }
        
        categoriesToTest = {
            [foundCategory]: categories[foundCategory].filter(ex => ex.name === SINGLE_EXERCISE)
        };
        log(`Testing single exercise: ${SINGLE_EXERCISE} in category: ${foundCategory}`);
    }

    // Créer le dossier de debug
    const debugDir = path.join(__dirname, '..', '..', 'debug');
    fs.mkdirSync(debugDir, { recursive: true });

    // Calculer le total d'exercices
    const totalExercises = Object.values(categoriesToTest).reduce((sum, exercises) => sum + exercises.length, 0);
    console.log(`\n🧪 Starting evaluation of ${totalExercises} exercises across ${Object.keys(categoriesToTest).length} categories...`);

    // Traiter les catégories en parallèle
    const startTime = Date.now();
    const categoryPromises = Object.entries(categoriesToTest).map(([categoryName, exercises]) => 
        processCategoryWorker(categoryName, exercises, starklingsPath)
    );

    const categoryResults = await Promise.all(categoryPromises);
    const endTime = Date.now();

    // Consolider les résultats
    const totalPassed = categoryResults.reduce((sum, result) => sum + result.passed, 0);
    const globalResults = {
        totalExercises: totalExercises,
        totalPassed: totalPassed,
        globalSuccessRate: (totalPassed / totalExercises * 100).toFixed(1),
        categories: categoryResults
    };

    // Sauvegarder le rapport global
    const globalReportPath = path.join(debugDir, 'global_report.json');
    fs.writeFileSync(globalReportPath, JSON.stringify(globalResults, null, 2));

    console.log(`\n=== Final Results ===`);
    console.log(`${totalPassed}/${totalExercises} exercises passed (${globalResults.globalSuccessRate}%)`);
    console.log(`Total time: ${(endTime - startTime) / 1000}s`);
    console.log(`\nCategory breakdown:`);
    
    categoryResults.forEach(result => {
        console.log(`  ${result.category}: ${result.passed}/${result.total} (${result.successRate}%)`);
    });

    log(`Reports saved in: ${debugDir}`);
    log(`Global report: ${globalReportPath}`);
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});