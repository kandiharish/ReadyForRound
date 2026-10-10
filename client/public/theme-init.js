// Apply the saved light/dark theme before the page draws, so there's no flash of the wrong colours.
(function () {
  var theme = null
  try { theme = localStorage.getItem('rfr-theme') } catch (e) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  document.documentElement.dataset.theme = theme
})()
