const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Configuration de débogage
const DEBUG = true;
const SINGLE_EXERCISE = process.env.SINGLE_EXERCISE || null;
const SAVE_RESPONSES = true;
const MAX_FEEDBACK_ATTEMPTS = 3; // Nombre maximum de tentatives de feedback
const RUN_NUMBER = 1;

function log(message) {
  // Fonction log désactivée
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
          currentExercise.hint = hintLines
            .join('\n')
            .replace(/^"""/, '')
            .replace(/"""$/, '');
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
    const response = await fetch('http://localhost:3001/', {
      method: 'GET',
      timeout: 5000,
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

async function callCairoCoderAPI(
  exerciseContent,
  exercise,
  errorFeedback = null,
  attemptNumber = 1,
  retries = 3,
) {
  let prompt;

  if (errorFeedback && attemptNumber > 1) {
    // Prompt avec feedback d'erreur
    prompt = `You are solving a Cairo programming exercise. Your previous attempt failed with the following error:

ERROR FEEDBACK (Attempt ${attemptNumber}/${MAX_FEEDBACK_ATTEMPTS + 1}):
Exit Code: ${errorFeedback.exitCode}
STDOUT: ${errorFeedback.stdout}
STDERR: ${errorFeedback.stderr}

Please analyze the error and fix the code accordingly.

Exercise: ${exercise.name}
${exercise.hint ? `Hint: ${exercise.hint}` : ''}

Instructions:
1. Carefully analyze the compilation error above
2. Fix the specific issues mentioned in the error output
3. Remove the "// I AM NOT DONE" comment when complete
4. Ensure the solution demonstrates the intended concept
5. The solution must be in the same language as the exercise (Cairo)

Code to fix:
${exerciseContent}

Please provide only the corrected code, without any additional explanation or markdown formatting.`;
  } else {
    // Prompt initial (première tentative)
    prompt = `You are solving a Cairo programming exercise.

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
  }

  const requestBody = {
    model: 'cairo-coder',
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log(
        `API call attempt ${attempt}/${retries} for ${exercise.name} (feedback attempt ${attemptNumber})`,
      );

      const response = await fetch(
        'http://localhost:3001/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          timeout: 120000, // 2 minutes
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();

      // Sauvegarder la réponse complète si demandé
      if (SAVE_RESPONSES) {
        const responseFile = path.join(
          __dirname,
          '..',
          '..',
          'debug',
          `${exercise.name}_response_attempt${attemptNumber}.json`,
        );
        fs.mkdirSync(path.dirname(responseFile), { recursive: true });
        fs.writeFileSync(responseFile, JSON.stringify(data, null, 2));
      }

      // Extraire le contenu de la réponse
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const rawContent = data.choices[0].message.content;
        const cleanCode = extractCairoCode(rawContent);
        log(
          `✅ API call successful for ${exercise.name} (attempt ${attemptNumber})`,
        );
        return cleanCode;
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      log(
        `❌ API call failed (attempt ${attempt}/${retries}) for ${exercise.name} (feedback attempt ${attemptNumber}): ${error.message}`,
      );

      if (attempt === retries) {
        throw error; // Dernier essai, on lance l'erreur
      }

      // Attendre de plus en plus longtemps à chaque retry
      const waitTime = 3000 * attempt; // 3s, 6s, 9s
      log(`Waiting ${waitTime}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

async function testExerciseWithFeedback(
  exercise,
  starklingsPath,
  runNumber = 1,
) {

  const exercisePath = path.join(starklingsPath, exercise.path);

  if (!fs.existsSync(exercisePath)) {
    log(`❌ Exercise file not found: ${exercisePath}`);
    return {
      success: false,
      error: { message: 'File not found', type: 'FILE_ERROR' },
      attempts: 0,
    };
  }

  // Lire le contenu original
  const originalContent = fs.readFileSync(exercisePath, 'utf8');

  // Sauvegarder l'original
  const backupPath = exercisePath + '.backup';
  fs.writeFileSync(backupPath, originalContent);

  let lastError = null;
  let correctedCode = null;
  let currentContent = originalContent;

  try {
    // Boucle de feedback avec MAX_FEEDBACK_ATTEMPTS + 1 tentatives au total
    for (
      let attemptNumber = 1;
      attemptNumber <= MAX_FEEDBACK_ATTEMPTS + 1;
      attemptNumber++
    ) {

      try {
        // Appeler l'API avec ou sans feedback selon l'attempt
        correctedCode = await callCairoCoderAPI(
          currentContent,
          exercise,
          attemptNumber > 1 ? lastError : null,
          attemptNumber,
        );

        // Sauvegarder la solution de cette tentative
        fs.writeFileSync(exercisePath, correctedCode);
        log(
          `Updated exercise file with generated code (attempt ${attemptNumber})`,
        );

        // Sauvegarder les fichiers de debug pour chaque tentative si c'est le dernier run
        if (SAVE_RESPONSES && runNumber === RUN_NUMBER) {
          const solutionFile = path.join(
            __dirname,
            '..',
            '..',
            'debug',
            `${exercise.name}_solution_attempt${attemptNumber}.cairo`,
          );
          fs.mkdirSync(path.dirname(solutionFile), { recursive: true });
          fs.writeFileSync(solutionFile, correctedCode);
        }

        // Tester la solution
        try {
          log(
            `Running starklings for ${exercise.name} (attempt ${attemptNumber})...`,
          );
          const result = execSync(
            `cargo run --bin starklings run ${exercise.name}`,
            {
              cwd: starklingsPath,
              stdio: 'pipe',
              timeout: 300000,
              encoding: 'utf8',
            },
          );

          log(`✅ ${exercise.name} - Success on attempt ${attemptNumber}!`);
          log(`Starklings output: ${result.substring(0, 200)}...`);

          return {
            success: true,
            attempts: attemptNumber,
            finalAttempt: attemptNumber,
          };
        } catch (error) {
          log(
            `❌ ${exercise.name} - Execution failed on attempt ${attemptNumber}`,
          );
          log(`Error code: ${error.status}`);
          log(
            `stdout: ${error.stdout ? error.stdout.substring(0, 500) : 'none'}`,
          );
          log(
            `stderr: ${error.stderr ? error.stderr.substring(0, 500) : 'none'}`,
          );

          // Formater l'erreur pour le feedback
          lastError = {
            exitCode: error.status,
            stdout: error.stdout || '',
            stderr: error.stderr || '',
          };

          // Sauvegarder les erreurs pour chaque tentative si c'est le dernier run
          if (SAVE_RESPONSES && runNumber === RUN_NUMBER) {
            const errorFile = path.join(
              __dirname,
              '..',
              '..',
              'debug',
              `${exercise.name}_error_attempt${attemptNumber}.txt`,
            );
            fs.writeFileSync(
              errorFile,
              `Attempt: ${attemptNumber}/${MAX_FEEDBACK_ATTEMPTS + 1}\nExit code: ${error.status}\n\nSTDOUT:\n${error.stdout}\n\nSTDERR:\n${error.stderr}`,
            );
            log(`Error details saved to: ${errorFile}`);
          }

          // Si c'est la dernière tentative, retourner l'échec
          if (attemptNumber === MAX_FEEDBACK_ATTEMPTS + 1) {
            log(
              `❌ ${exercise.name} - All ${MAX_FEEDBACK_ATTEMPTS + 1} attempts failed`,
            );
            return {
              success: false,
              error: lastError,
              attempts: attemptNumber,
              finalAttempt: attemptNumber,
            };
          }

          // Préparer la prochaine tentative avec le code corrigé comme base
          currentContent = correctedCode;

          // Attendre un peu avant la prochaine tentative
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (apiError) {
        log(
          `❌ ${exercise.name} - API call failed on attempt ${attemptNumber}: ${apiError.message}`,
        );

        // Si c'est la dernière tentative ou si l'API échoue, retourner l'erreur
        if (attemptNumber === MAX_FEEDBACK_ATTEMPTS + 1) {
          return {
            success: false,
            error: { message: apiError.message, type: 'API_ERROR' },
            attempts: attemptNumber,
            finalAttempt: attemptNumber,
          };
        }

        // Pour les erreurs API, on garde le même contenu pour la prochaine tentative
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } finally {
    // Restaurer l'original
    fs.writeFileSync(exercisePath, originalContent);
    fs.unlinkSync(backupPath);
    log(`Restored original file and cleaned up backup`);
  }
}

async function processCategoryWorker(
  categoryName,
  exercises,
  starklingsPath,
  runNumber = 1,
) {
  const categoryResults = {
    category: categoryName,
    exercises: [],
    passed: 0,
    total: exercises.length,
    totalAttempts: 0,
    feedbackSuccesses: 0, // Succès après feedback (attempt > 1)
  };


  for (const exercise of exercises) {
    // Délai entre chaque exercice pour éviter la surcharge
    if (categoryResults.exercises.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 seconde
    }

    const result = await testExerciseWithFeedback(
      exercise,
      starklingsPath,
      runNumber,
    );

    const exerciseResult = {
      name: exercise.name,
      success: result.success,
      attempts: result.attempts || 1,
      finalAttempt: result.finalAttempt || 1,
    };

    if (!result.success && result.error) {
      exerciseResult.error = result.error;
    }

    categoryResults.exercises.push(exerciseResult);
    categoryResults.totalAttempts += result.attempts || 1;

    if (result.success) {
      categoryResults.passed++;
      // Compter les succès après feedback
      if (result.finalAttempt > 1) {
        categoryResults.feedbackSuccesses++;
      }
    }

    const statusEmoji = result.success ? '✅' : '❌';
    const attemptInfo =
      result.attempts > 1 ? ` (${result.attempts} attempts)` : '';
    console.log(`[${categoryName}] ${exercise.name}: ${statusEmoji}${attemptInfo}`);
  }

  categoryResults.successRate = (
    (categoryResults.passed / categoryResults.total) *
    100
  ).toFixed(1);

  categoryResults.averageAttempts = (
    (categoryResults.totalAttempts / categoryResults.total)
  ).toFixed(1);

  const reportPath = path.join(
    __dirname,
    '..',
    '..',
    'debug',
    `${categoryName.toLowerCase().replace(/\s+/g, '_')}_report_run${runNumber}.json`,
  );
  fs.writeFileSync(reportPath, JSON.stringify(categoryResults, null, 2));

  log(
    `[${categoryName}] Completed: ${categoryResults.passed}/${categoryResults.total} (${categoryResults.successRate}%) - Avg attempts: ${categoryResults.averageAttempts} - Feedback successes: ${categoryResults.feedbackSuccesses}`,
  );
  return categoryResults;
}

function extractCairoCode(generatedResponse) {
  // Chercher les blocs de code Cairo ou génériques
  const codeBlockRegex = /```(?:cairo|rust|)?\s*\n([\s\S]*?)\n```/g;
  const matches = generatedResponse.match(codeBlockRegex);

  if (matches && matches.length > 0) {
    // Extraire le contenu du premier bloc de code trouvé
    const codeBlock = matches[0];
    const codeContent = codeBlock
      .replace(/```(?:cairo|rust|)?\s*\n/, '')
      .replace(/\n```$/, '');
    return codeContent.trim();
  }

  // Si pas de bloc de code trouvé, retourner le texte tel quel
  return generatedResponse.trim();
}

function generateConsolidatedReport(allResults) {
  if (allResults.length === 0) {
    return { error: 'No successful runs' };
  }

  // Taux de réussite global
  const successRates = allResults.map((r) => parseFloat(r.globalSuccessRate));
  const averageSuccessRate = (
    successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length
  ).toFixed(1);

  // Statistiques de tentatives
  const totalAttempts = allResults.reduce(
    (sum, run) =>
      sum +
      run.categories.reduce((catSum, cat) => catSum + cat.totalAttempts, 0),
    0,
  );
  const totalExercises = allResults.reduce(
    (sum, run) => sum + run.totalExercises,
    0,
  );
  const averageAttemptsPerExercise = (totalAttempts / totalExercises).toFixed(
    1,
  );

  // Succès grâce au feedback
  const totalFeedbackSuccesses = allResults.reduce(
    (sum, run) =>
      sum +
      run.categories.reduce(
        (catSum, cat) => catSum + (cat.feedbackSuccesses || 0),
        0,
      ),
    0,
  );

  // Taux de réussite par catégorie
  const categoryStats = {};
  allResults.forEach((run) => {
    run.categories.forEach((category) => {
      if (!categoryStats[category.category]) {
        categoryStats[category.category] = {
          successRates: [],
          averageAttempts: [],
          feedbackSuccesses: [],
        };
      }
      categoryStats[category.category].successRates.push(
        parseFloat(category.successRate),
      );
      categoryStats[category.category].averageAttempts.push(
        parseFloat(category.averageAttempts),
      );
      categoryStats[category.category].feedbackSuccesses.push(
        category.feedbackSuccesses || 0,
      );
    });
  });

  // Calculer les moyennes par catégorie
  const categoryAverages = {};
  Object.keys(categoryStats).forEach((category) => {
    const rates = categoryStats[category].successRates;
    const attempts = categoryStats[category].averageAttempts;
    const feedbacks = categoryStats[category].feedbackSuccesses;

    categoryAverages[category] = {
      successRate:
        (rates.reduce((sum, rate) => sum + rate, 0) / rates.length).toFixed(1) +
        '%',
      averageAttempts: (
        attempts.reduce((sum, att) => sum + att, 0) / attempts.length
      ).toFixed(1),
      totalFeedbackSuccesses: feedbacks.reduce((sum, fb) => sum + fb, 0),
    };
  });

  // Collecter les erreurs par catégorie et par exercice
  const exerciseErrorsByCategory = {};
  allResults.forEach((run) => {
    run.categories.forEach((category) => {
      category.exercises.forEach((exercise) => {
        if (!exercise.success && exercise.error) {
          // Initialiser la catégorie si elle n'existe pas
          if (!exerciseErrorsByCategory[category.category]) {
            exerciseErrorsByCategory[category.category] = {};
          }

          // Initialiser l'exercice si il n'existe pas
          if (!exerciseErrorsByCategory[category.category][exercise.name]) {
            exerciseErrorsByCategory[category.category][exercise.name] = [];
          }

          // Ajouter l'erreur avec le numéro de run et les tentatives
          exerciseErrorsByCategory[category.category][exercise.name].push({
            run: run.runNumber,
            attempts: exercise.attempts || 1,
            finalAttempt: exercise.finalAttempt || 1,
            type: exercise.error.type || 'COMPILATION_ERROR',
            message: exercise.error.message || 'Compilation failed',
            stdout: exercise.error.stdout
              ? exercise.error.stdout.substring(0, 500)
              : null,
            stderr: exercise.error.stderr
              ? exercise.error.stderr.substring(0, 500)
              : null,
          });
        }
      });
    });
  });

  return {
    summary: {
      totalRuns: allResults.length,
      globalSuccessRate: averageSuccessRate + '%',
      averageAttemptsPerExercise: averageAttemptsPerExercise,
      totalFeedbackSuccesses: totalFeedbackSuccesses,
      feedbackSuccessRate:
        totalExercises > 0
          ? ((totalFeedbackSuccesses / totalExercises) * 100).toFixed(1) + '%'
          : '0%',
    },
    categorySuccessRates: categoryAverages,
    exerciseErrorsByCategory: exerciseErrorsByCategory,
  };
}

async function runSingleTest(runNumber) {
  const starklingsPath = path.join(process.cwd(), 'starklings');
  const infoPath = path.join(starklingsPath, 'info.toml');

  if (!fs.existsSync(starklingsPath)) {
    throw new Error('Starklings directory not found');
  }

  if (!fs.existsSync(infoPath)) {
    throw new Error('info.toml not found in starklings directory');
  }

  // Tester la connexion au serveur
  const serverOk = await testServerConnection();
  if (!serverOk) {
    throw new Error('Server is not accessible');
  }

  // Parser les exercices par catégorie
  const categories = parseInfoToml(infoPath);

  if (Object.keys(categories).length === 0) {
    throw new Error('No categories found');
  }

  // Filtrer à une seule catégorie si demandé
  let categoriesToTest = categories;
  if (SINGLE_EXERCISE) {
    let foundCategory = null;
    for (const [categoryName, exercises] of Object.entries(categories)) {
      if (exercises.some((ex) => ex.name === SINGLE_EXERCISE)) {
        foundCategory = categoryName;
        break;
      }
    }

    if (!foundCategory) {
      throw new Error(`Exercise '${SINGLE_EXERCISE}' not found`);
    }

    categoriesToTest = {
      [foundCategory]: categories[foundCategory].filter(
        (ex) => ex.name === SINGLE_EXERCISE,
      ),
    };
    log(
      `Testing single exercise: ${SINGLE_EXERCISE} in category: ${foundCategory}`,
    );
  }

  // Créer le dossier de debug
  const debugDir = path.join(__dirname, '..', '..', 'debug');
  fs.mkdirSync(debugDir, { recursive: true });

  // Calculer le total d'exercices
  const totalExercises = Object.values(categoriesToTest).reduce(
    (sum, exercises) => sum + exercises.length,
    0,
  );

  console.log(`\n🧪 Starting Starklings evaluation: ${totalExercises} exercises across ${Object.keys(categoriesToTest).length} categories`);
  console.log(`Categories: ${Object.keys(categoriesToTest).join(', ')}`);

  // Traiter les catégories en parallèle
  const startTime = Date.now();
  const categoryPromises = Object.entries(categoriesToTest).map(
    ([categoryName, exercises]) =>
      processCategoryWorker(categoryName, exercises, starklingsPath, runNumber),
  );

  const categoryResults = await Promise.all(categoryPromises);
  const endTime = Date.now();

  // Consolider les résultats
  const totalPassed = categoryResults.reduce(
    (sum, result) => sum + result.passed,
    0,
  );
  const totalAttempts = categoryResults.reduce(
    (sum, result) => sum + result.totalAttempts,
    0,
  );
  const totalFeedbackSuccesses = categoryResults.reduce(
    (sum, result) => sum + (result.feedbackSuccesses || 0),
    0,
  );

  const globalResults = {
    runNumber: runNumber,
    timestamp: new Date().toISOString(),
    totalExercises: totalExercises,
    totalPassed: totalPassed,
    totalAttempts: totalAttempts,
    totalFeedbackSuccesses: totalFeedbackSuccesses,
    globalSuccessRate: ((totalPassed / totalExercises) * 100).toFixed(1),
    averageAttempts: (totalAttempts / totalExercises).toFixed(1),
    feedbackSuccessRate: (
      (totalFeedbackSuccesses / totalExercises) *
      100
    ).toFixed(1),
    executionTime: (endTime - startTime) / 1000,
    categories: categoryResults,
  };

  // Sauvegarder le rapport global pour ce run
  const globalReportPath = path.join(
    debugDir,
    `global_report_run${runNumber}.json`,
  );
  fs.writeFileSync(globalReportPath, JSON.stringify(globalResults, null, 2));

  return globalResults;
}

async function main() {
  const NUM_RUNS = 1;
  const allResults = [];


  for (let i = 1; i <= NUM_RUNS; i++) {
    try {
      const result = await runSingleTest(i);
      allResults.push(result);

      // Petite pause entre les runs pour éviter la surcharge
      if (i < NUM_RUNS) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      // console.error(`❌ Run ${i} failed:`, error.message);
      // Continuer avec les autres runs même si un échoue
    }
  }

  // Générer le rapport consolidé
  const debugDir = path.join(__dirname, '..', '..', 'debug');
  const consolidatedReport = generateConsolidatedReport(allResults);
  const consolidatedReportPath = path.join(
    debugDir,
    'consolidated_report.json',
  );
  fs.writeFileSync(
    consolidatedReportPath,
    JSON.stringify(consolidatedReport, null, 2),
  );

  if (consolidatedReport.summary) {
    console.log(`\nFinal Results: ${allResults[0].totalPassed}/${allResults[0].totalExercises} exercises passed (${consolidatedReport.summary.globalSuccessRate})`);
  }


}

main().catch((error) => {
  // console.error('❌ Fatal error:', error);
  process.exit(1);
}); 