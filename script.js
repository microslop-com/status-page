async function checkTheSlop() {
    const statusText = document.getElementById('current-status-text');
    const statusPulse = document.getElementById('status-pulse-dot');
    
    try {
        // We ping a common MS asset. Note: CORS might block a direct fetch, 
        // so in a production app, you'd use a small backend proxy or a 'no-cors' mode check.
        const startTime = Date.now();
        const response = await fetch('https://outlook.office365.com/owa/healthcheck.htm', { mode: 'no-cors' });
        const latency = Date.now() - startTime;

        if (latency > 3000) {
            statusText.innerText = "Current State: High Latency Slop";
            statusText.className = "text-sm font-medium text-orange-400";
            statusPulse.className = "relative inline-flex rounded-full h-3 w-3 bg-orange-600";
        } else {
            statusText.innerText = "Current State: Acceptable Slop";
            statusText.className = "text-sm font-medium text-green-400";
            statusPulse.className = "relative inline-flex rounded-full h-3 w-3 bg-green-600";
        }
    } catch (error) {
        statusText.innerText = "Current State: MAXIMUM SLOP (Outage)";
        statusText.className = "text-sm font-medium text-red-500";
        statusPulse.className = "relative inline-flex rounded-full h-3 w-3 bg-red-600";
    }
}

// Check every 60 seconds
setInterval(checkTheSlop, 60000);
window.onload = checkTheSlop;
