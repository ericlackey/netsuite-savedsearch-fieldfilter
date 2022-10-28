/*
*
* This script handles injecting code into the site
*
*/

// Inject script into the main page
var s = document.createElement('script');
s.src = chrome.runtime.getURL('scripts/ns_ss_fieldfilter.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

