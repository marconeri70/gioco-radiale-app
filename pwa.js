
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js',{scope:'./'}));
}
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt', (e) => { 
  e.preventDefault(); deferredPrompt=e; 
  document.getElementById('btnInstall').style.display='inline-block';
});
document.getElementById('btnInstall').onclick=async()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice;
  deferredPrompt=null; document.getElementById('btnInstall').remove();
};
