/**
 * Leaderboard Service - Uses Google Sheets as backend
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet with columns: Timestamp, Name, Scenario, Score, BeatAI
 * 2. Go to Extensions > Apps Script
 * 3. Paste the Apps Script code (see APPS_SCRIPT_CODE below)
 * 4. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 5. Copy the Web App URL and paste it as SHEETS_API_URL below
 */

// Replace with your deployed Google Apps Script URL
const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbx-UtePH1R_nLdjsDc-NGgllN1mG2mgfbcBh_LQ1WftAE5NQWvlKf-cjqZpNsfAoY4b/exec';

/**
 * Submit a score to the leaderboard
 * @param {string} name - Player name
 * @param {string} scenario - Scenario ID (simple, moderate, complex)
 * @param {number} score - Player's total cost (lower is better)
 * @param {boolean} beatAI - Whether player beat the AI
 */
export async function submitScore(name, scenario, score, beatAI) {
  if (!name || !scenario || score === undefined) {
    console.error('Missing required fields for score submission');
    return { success: false, error: 'Missing fields' };
  }

  try {
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      mode: 'no-cors', // Required for Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'submit',
        name: name.substring(0, 20), // Limit name length
        scenario,
        score: Math.round(score * 100) / 100,
        beatAI
      })
    });

    // no-cors mode doesn't give us response body, assume success
    return { success: true };
  } catch (error) {
    console.error('Failed to submit score:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch leaderboard data for a scenario
 * @param {string} scenario - Scenario ID (simple, moderate, complex) or 'all'
 * @returns {Promise<Array>} Array of leaderboard entries
 */
export async function fetchLeaderboard(scenario = 'all') {
  try {
    const url = `${SHEETS_API_URL}?action=leaderboard&scenario=${scenario}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }

    const data = await response.json();
    const entries = data.entries || [];

    // Post-process ranks for ties (Standard Competition Ranking: 1, 1, 3)
    const processedData = [];
    for (let i = 0; i < entries.length; i++) {
      let rank = i + 1;
      if (i > 0 && Math.abs(entries[i].score - entries[i - 1].score) < 0.01) {
        rank = processedData[i - 1].rank;
      }
      processedData.push({ ...entries[i], rank });
    }

    return processedData;
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }
}

/**
 * GOOGLE APPS SCRIPT CODE - Deploy this as a Web App
 * 
 * Copy everything between the START and END markers into Google Apps Script
 * 
 * --- START APPS SCRIPT ---
 
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const action = e.parameter.action;
  const scenario = e.parameter.scenario || 'all';
  
  if (action === 'leaderboard') {
    return getLeaderboard(sheet, scenario);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'submit') {
      const rows = sheet.getDataRange().getValues();
      let found = false;
      let rowIndex = -1;
      
      // Check for existing entry for this name + scenario
      // Start from 1 to skip header
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === data.name && rows[i][2] === data.scenario) {
          found = true;
          rowIndex = i + 1; // 1-based index for Sheet API
          
          // Check if new score is better (lower is better)
          const currentScore = parseFloat(rows[i][3]);
          const newScore = parseFloat(data.score);
          
          if (newScore < currentScore) {
            // Update the existing row
            sheet.getRange(rowIndex, 1, 1, 5).setValues([[
              new Date(),
              data.name,
              data.scenario,
              data.score,
              data.beatAI ? 'Yes' : 'No'
            ]]);
          }
          break;
        }
      }
      
      if (!found) {
        // Append new row
        sheet.appendRow([
          new Date(),
          data.name,
          data.scenario,
          data.score,
          data.beatAI ? 'Yes' : 'No'
        ]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getLeaderboard(sheet, scenario) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  // Filter by scenario if specified
  let filtered = rows;
  if (scenario !== 'all') {
    filtered = rows.filter(row => row[2] === scenario);
  }
  
  // Sort by score (ascending - lower is better)
  filtered.sort((a, b) => a[3] - b[3]);
  
  // Take top 10
  const top10 = filtered.slice(0, 10);
  
  const entries = top10.map((row, index) => ({
    rank: index + 1,
    name: row[1],
    scenario: row[2],
    score: row[3],
    beatAI: row[4] === 'Yes',
    date: row[0]
  }));
  
  return ContentService.createTextOutput(JSON.stringify({ entries }))
    .setMimeType(ContentService.MimeType.JSON);
}

 * --- END APPS SCRIPT ---
 */
