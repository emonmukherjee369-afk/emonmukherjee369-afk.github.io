const inputField = document.getElementById('math-input');
const resultBox = document.getElementById('result-box');
const errorBox = document.getElementById('error-message');

const btnSimplify = document.getElementById('btn-simplify');
const btnDerive = document.getElementById('btn-derive');
const btnIntegrate = document.getElementById('btn-integrate');

// Helper to format output
function formatOutput(expression, prefix = '') {
    // Replace * with • for prettier math output
    let prettyStr = expression.text('decimals');
    return `${prefix} ${prettyStr}`;
}

function clearError() {
    errorBox.classList.add('hidden');
    errorBox.textContent = '';
}

function showError(msg) {
    resultBox.innerHTML = '<span class="placeholder">Error</span>';
    errorBox.textContent = 'Syntax Error: ' + msg;
    errorBox.classList.remove('hidden');
}

function executeMath(operation) {
    clearError();
    const input = inputField.value.trim();
    
    if (!input) {
        resultBox.innerHTML = '<span class="placeholder">Awaiting input...</span>';
        return;
    }

    try {
        let result;
        let prefix = '';

        if (operation === 'simplify') {
            result = nerdamer(input);
            prefix = '=';
        } 
        else if (operation === 'derivative') {
            // nerdamer('diff(expression, x)')
            result = nerdamer(`diff(${input}, x)`);
            prefix = "f'(x) =";
        } 
        else if (operation === 'integrate') {
            // nerdamer('integrate(expression, x)')
            result = nerdamer(`integrate(${input}, x)`);
            prefix = "∫f(x)dx =";
            // Add + C for indefinite integrals
            resultBox.textContent = formatOutput(result, prefix) + ' + C';
            return;
        }

        resultBox.textContent = formatOutput(result, prefix);
        
    } catch (e) {
        console.error(e);
        showError("Ensure your math syntax is correct (e.g., use 'x^2' not 'x2', '2*x' or '2x').");
    }
}

// Event Listeners
btnSimplify.addEventListener('click', () => executeMath('simplify'));
btnDerive.addEventListener('click', () => executeMath('derivative'));
btnIntegrate.addEventListener('click', () => executeMath('integrate'));

// Allow Enter key to simplify
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        executeMath('simplify');
    }
});
