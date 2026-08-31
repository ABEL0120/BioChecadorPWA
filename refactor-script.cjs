const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

code = code.replace(/set([A-Z][a-zA-Z0-9_]*)\(([\s\S]*?)\)/g, (match, p1, p2) => {
  const varName = p1.charAt(0).toLowerCase() + p1.slice(1);
  if (['toastState', 'alertState', 'rfc', 'loading', 'enrolling', 'marking', 'showReenrollButton', 'fetchingGps', 'hasPendingOffline', 'userLocation', 'registroResult', 'errorMsg', 'biometricAvailable'].includes(varName)) {
    if (varName === 'alertState') {
        return `dispatch({ type: 'SHOW_ALERT', payload: ${p2} })`;
    }
    if (varName === 'toastState') {
        return `dispatch({ type: 'SHOW_TOAST', payload: ${p2} })`;
    }
    return `dispatch({ type: 'SET_STATE', payload: { ${varName}: ${p2} } })`;
  }
  return match;
});

// Fix setAlertState({...alertState, show: false}) to use 'SHOW_ALERT' with empty or just use a custom HIDE action, but we didn't add it.
// Let's replace dispatch({ type: 'SHOW_ALERT', payload: { ...alertState, show: false } }) with dispatch({ type: 'SET_STATE', payload: { alertState: { ...alertState, show: false } } })

code = code.replace(/dispatch\({ type: 'SHOW_ALERT', payload: { \.\.\.alertState, show: false } }\)/g, "dispatch({ type: 'SET_STATE', payload: { alertState: { ...alertState, show: false } } })");
code = code.replace(/dispatch\({ type: 'SHOW_TOAST', payload: { \.\.\.toastState, show: false } }\)/g, "dispatch({ type: 'SET_STATE', payload: { toastState: { ...toastState, show: false } } })");

fs.writeFileSync('src/pages/Home.tsx', code);
