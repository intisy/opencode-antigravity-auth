const fs = require('fs');
try {
  const payload = JSON.parse(fs.readFileSync('C:/Users/finn/.config/opencode/gemini-final-payload.json', 'utf8'));
  const contents = payload.request.contents;
  for (let i = 0; i < contents.length; i++) {
    const turn = contents[i];
    const prevTurn = i > 0 ? contents[i-1] : null;
    const nextTurn = i < contents.length - 1 ? contents[i+1] : null;
    if (prevTurn && turn.role === prevTurn.role) console.log('Error at ' + i + ': role ' + turn.role + ' repeated');
    if (turn.role === 'model') {
      const hasCall = turn.parts.some(p => p.functionCall);
      if (hasCall) {
        if (!nextTurn) console.log('Error at ' + i + ': model has functionCall but no next turn');
        else if (nextTurn.role !== 'user' || !nextTurn.parts.some(p => p.functionResponse)) console.log('Error at ' + i + ': model has functionCall but next is ' + nextTurn.role);
      }
    }
    if (turn.role === 'user') {
      const hasResp = turn.parts.some(p => p.functionResponse);
      if (hasResp) {
        if (!prevTurn) console.log('Error at ' + i + ': user has functionResponse but no prev turn');
        else if (prevTurn.role !== 'model' || !prevTurn.parts.some(p => p.functionCall)) console.log('Error at ' + i + ': user has functionResponse but prev is ' + prevTurn.role);
      }
    }
  }
  console.log('Validation complete');
} catch (e) { console.error(e.message); }