import * as participantsPage from './modules/pages/participants-page.js';
import * as disciplinesPage from './modules/pages/disciplines-page.js';
import * as resultsPage from './modules/pages/results-page.js';
import * as dashboardPage from './modules/pages/dashboard-page.js';
import * as syncPage from './modules/pages/sync-page.js';
import * as importExportPage from './modules/pages/import-export-page.js';

async function initPage() {
    const pathname = window.location.pathname;
    const page = pathname.substring(pathname.lastIndexOf('/') + 1) || 'central.html';

    try {
        if (page.includes('central-participants')) {
            await participantsPage.init();
        } else if (page.includes('central-disciplines')) {
            await disciplinesPage.init();
        } else if (page.includes('central-results')) {
            await resultsPage.init();
        } else if (page.includes('central-sync')) {
            await syncPage.init();
        } else if (page.includes('central-import-export')) {
            await importExportPage.init();
        } else {
            await dashboardPage.init();
        }
    } catch (error) {
        console.error('Error initializing page:', error);
    }
}

// Initialize page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}
